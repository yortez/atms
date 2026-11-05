<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AlumniDocument;
use App\Models\AlumniProfile;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class AlumniDocumentController extends Controller
{
    public function index(AlumniProfile $profile): JsonResponse
    {
        $this->authorize('view', $profile);

        return response()->json([
            'data' => $profile->documents()->latest('uploaded_at')->get([
                'id',
                'alumni_id',
                'document_type',
                'original_name',
                'mime_type',
                'size_bytes',
                'uploaded_at',
            ]),
        ]);
    }

    public function store(
        Request $request,
        AlumniProfile $profile,
        ActivityLogger $activityLogger,
    ): JsonResponse {
        $this->authorize('update', $profile);

        $data = $request->validate([
            'document_type' => ['required', Rule::in(['resume', 'supporting'])],
            'file' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:10240'],
        ]);
        $file = $data['file'];
        $disk = 'local';
        $path = $file->store("alumni/{$profile->id}/documents", $disk);

        try {
            $document = DB::transaction(fn () => $profile->documents()->create([
                'uploaded_by_user_id' => $request->user()->id,
                'document_type' => $data['document_type'],
                'disk' => $disk,
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
                'size_bytes' => $file->getSize(),
                'uploaded_at' => now(),
            ]));
        } catch (Throwable $exception) {
            Storage::disk($disk)->delete($path);

            throw $exception;
        }

        $activityLogger->record('alumni.document_uploaded', $document, [
            'document_type' => $document->document_type,
        ]);

        return response()->json([
            'data' => $document->only([
                'id',
                'alumni_id',
                'document_type',
                'original_name',
                'mime_type',
                'size_bytes',
                'uploaded_at',
            ]),
        ], 201);
    }

    public function download(AlumniDocument $document): StreamedResponse
    {
        $this->authorize('view', $document->alumni);

        abort_unless(Storage::disk($document->disk)->exists($document->path), 404);

        return Storage::disk($document->disk)->download($document->path, $document->original_name);
    }

    public function destroy(AlumniDocument $document, ActivityLogger $activityLogger): JsonResponse
    {
        $this->authorize('update', $document->alumni);

        $disk = Storage::disk($document->disk);
        if ($disk->exists($document->path) && ! $disk->delete($document->path)) {
            throw new RuntimeException('The private document could not be deleted.');
        }

        $activityLogger->record('alumni.document_deleted', $document, [
            'document_type' => $document->document_type,
        ]);
        $document->delete();

        return response()->json(status: 204);
    }
}
