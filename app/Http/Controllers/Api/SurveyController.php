<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class SurveyController extends Controller
{
    public const SUPPORTED_QUESTION_TYPES = [
        'text',
        'short_text',
        'textarea',
        'long_text',
        'radio',
        'multiple_choice',
        'choice',
        'multiselect',
        'checkbox',
        'select',
        'dropdown',
        'rating',
        'date',
        'number',
        'boolean',
        'yes_no',
    ];

    public const CHOICE_QUESTION_TYPES = [
        'radio',
        'multiple_choice',
        'choice',
        'multiselect',
        'checkbox',
        'select',
        'dropdown',
    ];

    public function index(Request $request): JsonResponse
    {
        if ($this->canManage($request)) {
            return response()->json([
                'data' => Survey::query()
                    ->with('questions')
                    ->withCount('responses')
                    ->latest()
                    ->paginate(25),
            ]);
        }

        if ($request->user()->hasRole('department-coordinator')) {
            return response()->json([
                'data' => Survey::query()
                    ->where('status', 'published')
                    ->where(fn ($query) => $query->whereNull('starts_at')->orWhereDate('starts_at', '<=', today()))
                    ->where(fn ($query) => $query->whereNull('closes_at')->orWhereDate('closes_at', '>=', today()))
                    ->with('questions')
                    ->withCount('responses')
                    ->latest('published_at')
                    ->paginate(25),
            ]);
        }

        abort_unless($request->user()->hasRole('alumni') && $request->user()->alumni_profile_id, 403);
        $profileId = (int) $request->user()->alumni_profile_id;

        $surveys = Survey::query()
            ->where('status', 'published')
            ->where(fn ($query) => $query->whereNull('starts_at')->orWhereDate('starts_at', '<=', today()))
            ->where(fn ($query) => $query->whereNull('closes_at')->orWhereDate('closes_at', '>=', today()))
            ->with('questions')
            ->withExists(['responses as has_responded' => fn ($query) => $query->where('alumni_profile_id', $profileId)])
            ->latest('published_at')
            ->get()
            ->filter(fn (Survey $survey) => $survey->matchesAlumniProfile($profileId))
            ->values();

        $paginator = new LengthAwarePaginator(
            $surveys,
            $surveys->count(),
            25,
            1,
            ['path' => $request->url()],
        );

        return response()->json(['data' => $paginator]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeManagement($request);
        $data = $this->validateSurvey($request, true);

        $survey = DB::transaction(function () use ($data, $request): Survey {
            $survey = Survey::create([
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'starts_at' => $data['starts_at'] ?? null,
                'closes_at' => $data['closes_at'] ?? null,
                'is_anonymous' => (bool) ($data['is_anonymous'] ?? false),
                'target_department_ids' => ! empty($data['target_department_ids']) ? array_values(array_map('intval', $data['target_department_ids'])) : null,
                'target_program_ids' => ! empty($data['target_program_ids']) ? array_values(array_map('intval', $data['target_program_ids'])) : null,
                'target_graduation_years' => ! empty($data['target_graduation_years']) ? array_values(array_map('intval', $data['target_graduation_years'])) : null,
                'created_by_user_id' => $request->user()->id,
            ]);
            $this->syncQuestions($survey, $data['questions']);

            return $survey;
        });

        return response()->json([
            'data' => $survey->load('questions')->loadCount('responses'),
        ], 201);
    }

    public function update(Request $request, Survey $survey): JsonResponse
    {
        $this->authorizeManagement($request);
        $data = $this->validateSurvey($request, false);

        if (isset($data['questions']) && $survey->responses()->exists()) {
            abort(409, 'Questions cannot be changed after responses have been submitted.');
        }

        DB::transaction(function () use ($survey, $data): void {
            $attributes = collect($data)->except('questions')->all();
            if (array_key_exists('target_department_ids', $attributes)) {
                $attributes['target_department_ids'] = ! empty($attributes['target_department_ids'])
                    ? array_values(array_map('intval', $attributes['target_department_ids']))
                    : null;
            }
            if (array_key_exists('target_program_ids', $attributes)) {
                $attributes['target_program_ids'] = ! empty($attributes['target_program_ids'])
                    ? array_values(array_map('intval', $attributes['target_program_ids']))
                    : null;
            }
            if (array_key_exists('target_graduation_years', $attributes)) {
                $attributes['target_graduation_years'] = ! empty($attributes['target_graduation_years'])
                    ? array_values(array_map('intval', $attributes['target_graduation_years']))
                    : null;
            }

            $survey->fill($attributes)->save();
            if (isset($data['questions'])) {
                $this->syncQuestions($survey, $data['questions']);
            }
        });

        return response()->json([
            'data' => $survey->refresh()->load('questions')->loadCount('responses'),
        ]);
    }

    public function publish(Request $request, Survey $survey): JsonResponse
    {
        $this->authorizeManagement($request);
        abort_if($survey->questions()->count() === 0, 422, 'A survey must have at least one question before publishing.');

        $survey->forceFill(['status' => 'published', 'published_at' => now()])->save();

        return response()->json([
            'data' => $survey->load('questions')->loadCount('responses'),
        ]);
    }

    public function close(Request $request, Survey $survey): JsonResponse
    {
        $this->authorizeManagement($request);

        $survey->forceFill([
            'status' => 'closed',
            'closes_at' => $survey->closes_at && $survey->closes_at->isPast() ? $survey->closes_at : now(),
        ])->save();

        return response()->json([
            'data' => $survey->load('questions')->loadCount('responses'),
        ]);
    }

    public function analytics(Request $request, Survey $survey): JsonResponse
    {
        $user = $request->user();
        abort_unless(
            $this->canManage($request) || $user->hasRole('department-coordinator'),
            403,
        );

        $responsesQuery = $survey->responses()->with('alumniProfile:id,name,email');

        if ($user->hasRole('department-coordinator') && ! $user->hasRole('system-administrator', 'alumni-coordinator')) {
            $assignedProgramIds = DB::table('user_program_assignments')
                ->where('user_id', $user->id)
                ->select('program_id');

            $scopedProfileIds = DB::table('alumni_education_records as edu')
                ->join('program_degrees as pd', 'pd.id', '=', 'edu.program_degree_id')
                ->whereIn('pd.program_id', $assignedProgramIds)
                ->select('edu.alumni_profile_id');

            $responsesQuery->whereIn('alumni_profile_id', $scopedProfileIds);
        }

        $responses = $responsesQuery->orderByDesc('submitted_at')->get();
        $questions = $survey->questions()->get();
        $totalResponses = $responses->count();

        $questionSummaries = $questions->map(function (SurveyQuestion $question) use ($responses, $survey, $totalResponses): array {
            $counts = [];
            $samples = [];

            foreach ($question->options ?? [] as $option) {
                $counts[(string) $option] = 0;
            }

            $answeredCount = 0;

            foreach ($responses as $response) {
                $answers = is_array($response->answers) ? $response->answers : [];
                $key = (string) $question->id;
                if (! array_key_exists($key, $answers) || $answers[$key] === null || $answers[$key] === '') {
                    continue;
                }

                $val = $answers[$key];
                $answeredCount++;

                if (is_array($val)) {
                    foreach ($val as $item) {
                        $label = (string) $item;
                        $counts[$label] = ($counts[$label] ?? 0) + 1;
                    }
                    $formattedAnswer = implode(', ', array_map('strval', $val));
                } elseif (is_bool($val)) {
                    $label = $val ? 'Yes' : 'No';
                    $counts[$label] = ($counts[$label] ?? 0) + 1;
                    $formattedAnswer = $label;
                } else {
                    $label = (string) $val;
                    $counts[$label] = ($counts[$label] ?? 0) + 1;
                    $formattedAnswer = $label;
                }

                if (count($samples) < 8) {
                    $samples[] = [
                        'respondent' => $survey->is_anonymous
                            ? 'Anonymous Alumnus'
                            : ($response->alumniProfile?->name ?? 'Verified Alumnus'),
                        'answer' => $formattedAnswer,
                        'submitted_at' => $response->submitted_at?->toDateString(),
                    ];
                }
            }

            $distribution = collect($counts)->map(fn (int $count, string $label) => [
                'label' => $label,
                'count' => $count,
                'percentage' => $answeredCount > 0 ? round(($count / $answeredCount) * 100, 1) : 0.0,
            ])->values()->all();

            return [
                'id' => $question->id,
                'prompt' => $question->prompt,
                'type' => $question->type,
                'is_required' => $question->is_required,
                'answered_count' => $answeredCount,
                'response_rate' => $totalResponses > 0 ? round(($answeredCount / $totalResponses) * 100, 1) : 0.0,
                'distribution' => $distribution,
                'recent_answers' => $samples,
            ];
        })->values()->all();

        return response()->json([
            'data' => [
                'survey_id' => $survey->id,
                'title' => $survey->title,
                'status' => $survey->status,
                'is_anonymous' => $survey->is_anonymous,
                'total_responses' => $totalResponses,
                'questions' => $questionSummaries,
            ],
        ]);
    }

    public function respond(Request $request, Survey $survey): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasRole('alumni') && $user->alumni_profile_id, 403);
        $profileId = (int) $user->alumni_profile_id;
        $profile = $user->alumniProfile;
        abort_unless(
            $profile && $profile->isComplete(),
            403,
            'Please complete your profile (gender, civil status, contact number, current address, and permanent address) before answering surveys.',
        );

        abort_unless(
            $survey->status === 'published'
                && (! $survey->starts_at || $survey->starts_at->lte(now()->endOfDay()))
                && (! $survey->closes_at || $survey->closes_at->gte(today())),
            404,
        );

        abort_unless(
            $survey->matchesAlumniProfile($profileId),
            403,
            'This survey is targeted to specific academic programs or graduating cohorts.',
        );

        abort_if(
            $survey->responses()->where('alumni_profile_id', $profileId)->exists(),
            409,
            'You have already responded.',
        );

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
            $type = $question->type;

            if (in_array($type, ['text', 'short_text', 'textarea', 'long_text'], true)) {
                $rules[$key][] = 'string';
                $rules[$key][] = 'max:5000';
            } elseif ($type === 'number') {
                $rules[$key][] = 'numeric';
            } elseif ($type === 'date') {
                $rules[$key][] = 'date';
            } elseif (in_array($type, ['boolean', 'yes_no'], true)) {
                $rules[$key][] = 'boolean';
            } elseif (in_array($type, ['multiselect', 'checkbox'], true)) {
                $rules[$key][] = 'array';
                $rules["{$key}.*"] = ['string', Rule::in($question->options ?? [])];
            } elseif (in_array($type, ['select', 'dropdown', 'radio', 'multiple_choice', 'choice'], true)) {
                $rules[$key][] = 'string';
                $rules[$key][] = Rule::in($question->options ?? []);
            } elseif ($type === 'rating') {
                $rules[$key][] = 'integer';
                $rules[$key][] = 'between:1,5';
            }
        }
        Validator::make($request->all(), $rules)->validate();

        $response = SurveyResponse::create([
            'survey_id' => $survey->id,
            'alumni_profile_id' => $profileId,
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
            'starts_at' => ['sometimes', 'nullable', 'date'],
            'closes_at' => ['sometimes', 'nullable', 'date'],
            'is_anonymous' => ['sometimes', 'boolean'],
            'target_department_ids' => ['sometimes', 'nullable', 'array'],
            'target_department_ids.*' => ['integer', 'exists:departments,id'],
            'target_program_ids' => ['sometimes', 'nullable', 'array'],
            'target_program_ids.*' => ['integer', 'exists:academic_programs,id'],
            'target_graduation_years' => ['sometimes', 'nullable', 'array'],
            'target_graduation_years.*' => ['integer', 'between:1950,2100'],
            'questions' => [$creating ? 'required' : 'sometimes', 'array', 'min:1'],
            'questions.*.prompt' => ['required_with:questions', 'string', 'max:1000'],
            'questions.*.type' => ['required_with:questions', Rule::in(self::SUPPORTED_QUESTION_TYPES)],
            'questions.*.options' => ['nullable', 'array'],
            'questions.*.options.*' => ['string', 'max:180'],
            'questions.*.is_required' => ['sometimes', 'boolean'],
            'questions.*.position' => ['sometimes', 'integer', 'min:0', 'max:65535'],
        ]);

        foreach ($data['questions'] ?? [] as $index => $question) {
            if (in_array($question['type'], self::CHOICE_QUESTION_TYPES, true)
                && empty($question['options'])) {
                abort(422, "Question {$index} requires at least one choice option.");
            }
        }

        return $data;
    }

    /**
     * @param  array<int, array<string, mixed>>  $questions
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
