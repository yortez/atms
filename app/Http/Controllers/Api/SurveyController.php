<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class SurveyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if ($this->canManage($request)) {
            return response()->json(['data' => Survey::query()->with('questions')->latest()->paginate(25)]);
        }

        if ($request->user()->hasRole('department-coordinator')) {
            return response()->json([
                'data' => Survey::query()->where('status', 'published')
                    ->where(fn ($query) => $query->whereNull('closes_at')->orWhereDate('closes_at', '>=', today()))
                    ->with('questions')
                    ->latest('published_at')->paginate(25),
            ]);
        }

        abort_unless($request->user()->hasRole('alumni') && $request->user()->alumni_profile_id, 403);
        $profileId = $request->user()->alumni_profile_id;

        return response()->json([
            'data' => Survey::query()->where('status', 'published')
                ->where(fn ($query) => $query->whereNull('closes_at')->orWhereDate('closes_at', '>=', today()))
                ->with('questions')
                ->withExists(['responses as has_responded' => fn ($query) => $query->where('alumni_profile_id', $profileId)])
                ->latest('published_at')->paginate(25),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeManagement($request);
        $data = $this->validateSurvey($request, true);

        $survey = DB::transaction(function () use ($data, $request): Survey {
            $survey = Survey::create([
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'closes_at' => $data['closes_at'] ?? null,
                'created_by_user_id' => $request->user()->id,
            ]);
            $this->syncQuestions($survey, $data['questions']);

            return $survey;
        });

        return response()->json(['data' => $survey->load('questions')], 201);
    }

    public function update(Request $request, Survey $survey): JsonResponse
    {
        $this->authorizeManagement($request);
        $data = $this->validateSurvey($request, false);

        if (isset($data['questions']) && $survey->responses()->exists()) {
            abort(409, 'Questions cannot be changed after responses have been submitted.');
        }

        DB::transaction(function () use ($survey, $data): void {
            $survey->fill(collect($data)->except('questions')->all())->save();
            if (isset($data['questions'])) {
                $this->syncQuestions($survey, $data['questions']);
            }
        });

        return response()->json(['data' => $survey->refresh()->load('questions')]);
    }

    public function publish(Request $request, Survey $survey): JsonResponse
    {
        $this->authorizeManagement($request);
        abort_if($survey->questions()->count() === 0, 422, 'A survey must have at least one question before publishing.');

        $survey->forceFill(['status' => 'published', 'published_at' => now()])->save();

        return response()->json(['data' => $survey->load('questions')]);
    }

    public function respond(Request $request, Survey $survey): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasRole('alumni') && $user->alumni_profile_id, 403);
        abort_unless(
            $survey->status === 'published'
                && (! $survey->closes_at || $survey->closes_at->gte(today())),
            404,
        );
        abort_if($survey->responses()->where('alumni_profile_id', $user->alumni_profile_id)->exists(), 409, 'You have already responded.');

        $request->validate(['answers' => ['required', 'array']]);
        $questions = $survey->questions()->get();
        $validIds = $questions->pluck('id')->map(fn ($id) => (string) $id)->all();
        $answers = $request->input('answers');
        $unknown = array_diff(array_map('strval', array_keys($answers)), $validIds);
        abort_if($unknown !== [], 422, 'Answers contain a question that is not part of this survey.');

        $rules = [];
        foreach ($questions as $question) {
            $key = "answers.{$question->id}";
            $rules[$key] = [$question->is_required ? 'required' : 'nullable'];
            if (in_array($question->type, ['text', 'textarea'], true)) {
                $rules[$key][] = 'string';
                $rules[$key][] = 'max:5000';
            } elseif ($question->type === 'number') {
                $rules[$key][] = 'numeric';
            } elseif ($question->type === 'boolean') {
                $rules[$key][] = 'boolean';
            } elseif ($question->type === 'multiselect') {
                $rules[$key][] = 'array';
                $rules["{$key}.*"] = ['string', Rule::in($question->options ?? [])];
            } elseif (in_array($question->type, ['select', 'rating'], true)) {
                $rules[$key][] = $question->type === 'rating' ? 'integer' : 'string';
                if ($question->type === 'select') {
                    $rules[$key][] = Rule::in($question->options ?? []);
                } else {
                    $rules[$key][] = 'between:1,5';
                }
            }
        }
        Validator::make($request->all(), $rules)->validate();

        $response = SurveyResponse::create([
            'survey_id' => $survey->id,
            'alumni_profile_id' => $user->alumni_profile_id,
            'answers' => $answers,
            'submitted_at' => now(),
        ]);

        return response()->json(['data' => $response], 201);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateSurvey(Request $request, bool $creating): array
    {
        $data = $request->validate([
            'title' => [$creating ? 'required' : 'sometimes', 'string', 'max:180'],
            'description' => ['sometimes', 'nullable', 'string', 'max:20000'],
            'closes_at' => ['sometimes', 'nullable', 'date'],
            'questions' => [$creating ? 'required' : 'sometimes', 'array', 'min:1'],
            'questions.*.prompt' => ['required_with:questions', 'string', 'max:1000'],
            'questions.*.type' => ['required_with:questions', Rule::in(['text', 'textarea', 'number', 'boolean', 'select', 'multiselect', 'rating'])],
            'questions.*.options' => ['nullable', 'array'],
            'questions.*.options.*' => ['string', 'max:180'],
            'questions.*.is_required' => ['sometimes', 'boolean'],
            'questions.*.position' => ['sometimes', 'integer', 'min:0', 'max:65535'],
        ]);
        foreach ($data['questions'] ?? [] as $index => $question) {
            if (in_array($question['type'], ['select', 'multiselect'], true)
                && empty($question['options'])) {
                abort(422, "Question {$index} requires at least one choice option.");
            }
        }

        return $data;
    }

    /**
     * @param array<int, array<string, mixed>> $questions
     */
    private function syncQuestions(Survey $survey, array $questions): void
    {
        $survey->questions()->delete();
        foreach (array_values($questions) as $position => $question) {
            $survey->questions()->create([
                'prompt' => $question['prompt'],
                'type' => $question['type'],
                'options' => $question['options'] ?? null,
                'is_required' => $question['is_required'] ?? true,
                'position' => $question['position'] ?? $position,
            ]);
        }
    }

    private function authorizeManagement(Request $request): void
    {
        abort_unless($this->canManage($request), 403);
    }

    private function canManage(Request $request): bool
    {
        return Gate::forUser($request->user())->allows('manageSurveys');
    }
}
