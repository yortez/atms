import { useEffect, useState, type FormEvent } from 'react';
import { AlumniProfileCompletionModal } from './alumni-profile';
import { Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    Award,
    Briefcase,
    BriefcaseBusiness,
    Building2,
    Calendar,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    Clock,
    Coins,
    Download,
    ExternalLink,
    Eye,
    FileCheck,
    FileText,
    Filter,
    GraduationCap,
    Info,
    Lock,
    MapPin,
    MessageSquareText,
    Pencil,
    Plus,
    Search,
    Settings,
    ShieldCheck,
    Sparkles,
    Trash2,
    TrendingUp,
    UploadCloud,
    UserPlus,
    UsersRound,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import ConfirmationDialog from '@/components/confirmation-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useApiResource } from '@/hooks/use-api-resource';
import {
    ApiError,
    apiRequest,
    type ApiEnvelope,
    type PaginatedApiResponse,
} from '@/lib/api';
import type {
    AcademicDepartment,
    AcademicProgram,
    ActivityLogEntry,
    AlumniDocumentItem,
    AlumniEvent,
    AlumniEventAttendee,
    Announcement,
    AlumniProfile,
    DashboardStatistics,
    EmploymentRecord,
    EmploymentStatus,
    Employer,
    JobApplication,
    JobPosting,
    RegistrationAssistanceRequest,
    Survey,
    UserNotification,
} from '@/types/alumni';

import {
    EmptyState,
    ErrorState,
    LoadingState,
    formatBytes,
    formatSalary,
    initials,
    isEmployedOutcome,
    statusClass,
    type RawPagination,
    type WorkspaceRole,
} from './shared';

const QUESTION_TYPE_LABELS: Record<string, string> = {
    text: 'Short Text',
    short_text: 'Short Text',
    textarea: 'Long Text',
    long_text: 'Long Text',
    radio: 'Multiple Choice',
    multiple_choice: 'Multiple Choice',
    choice: 'Multiple Choice',
    multiselect: 'Checkbox (Multi-Select)',
    checkbox: 'Checkbox (Multi-Select)',
    select: 'Dropdown',
    dropdown: 'Dropdown',
    rating: 'Rating Scale (1–5)',
    date: 'Date',
    number: 'Number',
    boolean: 'Yes / No',
    yes_no: 'Yes / No',
};

const BUILDER_QUESTION_TYPES = [
    { value: 'text', label: 'Short Text' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'radio', label: 'Multiple Choice (Single)' },
    { value: 'multiselect', label: 'Checkbox (Multiple)' },
    { value: 'select', label: 'Dropdown' },
    { value: 'rating', label: 'Rating Scale (1–5)' },
    { value: 'date', label: 'Date' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Yes / No' },
] as const;

function requiresQuestionOptions(type: string): boolean {
    return [
        'radio',
        'multiple_choice',
        'choice',
        'multiselect',
        'checkbox',
        'select',
        'dropdown',
    ].includes(type);
}

function SurveyResponseForm({
    survey,
    onSubmitted,
}: {
    survey: Survey;
    onSubmitted: () => void;
}) {
    const [answers, setAnswers] = useState<Record<number, unknown>>({});
    const [saving, setSaving] = useState(false);

    function updateAnswer(id: number, value: unknown) {
        setAnswers((current) => ({ ...current, [id]: value }));
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        try {
            await apiRequest<ApiEnvelope<{ id: number }>>(
                `/api/surveys/${survey.id}/responses`,
                { method: 'POST', body: { answers } },
            );
            onSubmitted();
            toast.success('Survey response submitted.');
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Survey response could not be submitted.',
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <form
            onSubmit={submit}
            className="mt-4 space-y-3.5 rounded-2xl bg-[#f3f6f2] p-4 sm:p-5"
        >
            {/* Respondent Header Card */}
            <div className="rounded-xl border border-[#dce4d9] border-t-8 border-t-[#2b5139] bg-white p-4 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[#2b5139]">
                        {survey.is_anonymous
                            ? '🔒 Anonymous Form · Your name will not be shown in response summaries'
                            : '📋 Institutional Tracer Form · 1 response per alumnus'}
                    </span>
                    <span className="text-[11px] font-medium text-[#b84a39]">
                        * Indicates required question
                    </span>
                </div>
            </div>

            {survey.questions.map((question, qIndex) => {
                const value = answers[question.id];
                const qType = question.type;

                return (
                    <div
                        key={question.id}
                        className="rounded-xl border border-[#dfe5dc] bg-white p-4 shadow-2xs sm:p-5"
                    >
                        <div className="mb-3 flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-[#233127] sm:text-sm">
                                {qIndex + 1}. {question.prompt}
                                {question.is_required && (
                                    <span className="ml-1 text-[#c93b2b]">
                                        *
                                    </span>
                                )}
                            </p>
                            <span className="shrink-0 rounded bg-[#f4f6f2] px-2 py-0.5 text-[10px] font-medium text-[#6f786e]">
                                {QUESTION_TYPE_LABELS[qType] ?? qType}
                            </span>
                        </div>

                        {(qType === 'textarea' || qType === 'long_text') && (
                            <textarea
                                required={question.is_required}
                                value={typeof value === 'string' ? value : ''}
                                placeholder="Your answer"
                                onChange={(event) =>
                                    updateAnswer(
                                        question.id,
                                        event.target.value,
                                    )
                                }
                                className="min-h-24 w-full border-b-2 border-[#dce2d9] bg-[#fafbf9] p-3 text-xs text-[#29382e] transition outline-none focus:border-[#2b5139] focus:bg-white"
                            />
                        )}

                        {(qType === 'radio' ||
                            qType === 'multiple_choice' ||
                            qType === 'choice') && (
                                <div className="space-y-2">
                                    {(question.options ?? []).map((option) => (
                                        <label
                                            key={option}
                                            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-xs transition ${value === option
                                                ? 'border-[#2b5139] bg-[#edf2eb] font-semibold text-[#2b5139]'
                                                : 'border-[#e8ece5] bg-white text-[#3d4a3f] hover:bg-[#f9faf8]'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name={`question-${question.id}`}
                                                required={question.is_required}
                                                checked={value === option}
                                                onChange={() =>
                                                    updateAnswer(
                                                        question.id,
                                                        option,
                                                    )
                                                }
                                                className="size-4 accent-[#2b5139]"
                                            />
                                            <span>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                        {(qType === 'multiselect' || qType === 'checkbox') && (
                            <div className="space-y-2">
                                {(question.options ?? []).map((option) => {
                                    const selected = Array.isArray(value)
                                        ? (value as string[])
                                        : [];
                                    const isChecked = selected.includes(option);
                                    return (
                                        <label
                                            key={option}
                                            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-xs transition ${isChecked
                                                ? 'border-[#2b5139] bg-[#edf2eb] font-semibold text-[#2b5139]'
                                                : 'border-[#e8ece5] bg-white text-[#3d4a3f] hover:bg-[#f9faf8]'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(event) =>
                                                    updateAnswer(
                                                        question.id,
                                                        event.target.checked
                                                            ? [
                                                                ...selected,
                                                                option,
                                                            ]
                                                            : selected.filter(
                                                                (item) =>
                                                                    item !==
                                                                    option,
                                                            ),
                                                    )
                                                }
                                                className="size-4 accent-[#2b5139]"
                                            />
                                            <span>{option}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        {(qType === 'select' || qType === 'dropdown') && (
                            <select
                                required={question.is_required}
                                value={
                                    value !== undefined && value !== null
                                        ? String(value)
                                        : ''
                                }
                                onChange={(event) =>
                                    updateAnswer(
                                        question.id,
                                        event.target.value,
                                    )
                                }
                                className="h-10 w-full max-w-sm rounded-lg border border-[#dce2d9] bg-white px-3 text-xs text-[#29382e] outline-none focus:border-[#2b5139]"
                            >
                                <option value="">Choose</option>
                                {(question.options ?? []).map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        )}

                        {qType === 'rating' && (
                            <div className="py-2">
                                <div className="flex items-center justify-between gap-2 sm:max-w-md">
                                    <span className="text-[11px] text-[#7a8278]">
                                        1 (Lowest)
                                    </span>
                                    <div className="flex items-center gap-3 sm:gap-5">
                                        {[1, 2, 3, 4, 5].map((score) => {
                                            const active =
                                                Number(value) === score;
                                            return (
                                                <label
                                                    key={score}
                                                    className="flex cursor-pointer flex-col items-center gap-1.5"
                                                >
                                                    <span className="text-xs font-semibold text-[#4d5a4f]">
                                                        {score}
                                                    </span>
                                                    <input
                                                        type="radio"
                                                        name={`question-${question.id}`}
                                                        required={
                                                            question.is_required
                                                        }
                                                        checked={active}
                                                        onChange={() =>
                                                            updateAnswer(
                                                                question.id,
                                                                score,
                                                            )
                                                        }
                                                        className="size-4 accent-[#2b5139]"
                                                    />
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <span className="text-[11px] text-[#7a8278]">
                                        5 (Highest)
                                    </span>
                                </div>
                            </div>
                        )}

                        {(qType === 'boolean' || qType === 'yes_no') && (
                            <div className="flex gap-3">
                                {[
                                    { label: 'Yes', val: true },
                                    { label: 'No', val: false },
                                ].map((item) => (
                                    <label
                                        key={item.label}
                                        className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-4 py-2 text-xs transition ${value === item.val
                                            ? 'border-[#2b5139] bg-[#edf2eb] font-semibold text-[#2b5139]'
                                            : 'border-[#e8ece5] bg-white text-[#3d4a3f]'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${question.id}`}
                                            required={question.is_required}
                                            checked={value === item.val}
                                            onChange={() =>
                                                updateAnswer(
                                                    question.id,
                                                    item.val,
                                                )
                                            }
                                            className="size-4 accent-[#2b5139]"
                                        />
                                        <span>{item.label}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {qType === 'date' && (
                            <input
                                type="date"
                                required={question.is_required}
                                value={typeof value === 'string' ? value : ''}
                                onChange={(event) =>
                                    updateAnswer(
                                        question.id,
                                        event.target.value,
                                    )
                                }
                                className="h-10 w-full max-w-xs rounded-lg border border-[#dce2d9] bg-white px-3 text-xs text-[#29382e] outline-none focus:border-[#2b5139]"
                            />
                        )}

                        {(qType === 'text' ||
                            qType === 'short_text' ||
                            qType === 'number') && (
                                <input
                                    type={qType === 'number' ? 'number' : 'text'}
                                    required={question.is_required}
                                    placeholder="Your answer"
                                    value={
                                        typeof value === 'string' ||
                                            typeof value === 'number'
                                            ? value
                                            : ''
                                    }
                                    onChange={(event) =>
                                        updateAnswer(
                                            question.id,
                                            qType === 'number'
                                                ? event.target.value === ''
                                                    ? ''
                                                    : Number(event.target.value)
                                                : event.target.value,
                                        )
                                    }
                                    className="h-10 w-full max-w-md border-b-2 border-[#dce2d9] bg-transparent px-1 text-xs text-[#29382e] transition outline-none focus:border-[#2b5139]"
                                />
                            )}
                    </div>
                );
            })}

            <div className="flex items-center justify-between pt-1">
                <button
                    type="submit"
                    disabled={saving}
                    className="h-9 rounded-lg bg-[#2b5139] px-5 text-xs font-semibold text-white shadow-xs hover:bg-[#21402c] disabled:opacity-60"
                >
                    {saving ? 'Submitting…' : 'Submit'}
                </button>
                <button
                    type="button"
                    onClick={() => setAnswers({})}
                    className="text-xs font-semibold text-[#2b5139] hover:underline"
                >
                    Clear form
                </button>
            </div>
        </form>
    );
}

type QuestionDraft = {
    prompt: string;
    type: string;
    options: string;
    optionsList: string[];
    is_required: boolean;
};

type SurveyAnalyticsPayload = {
    survey_id: number;
    title: string;
    status: string;
    is_anonymous: boolean;
    total_responses: number;
    questions: Array<{
        id: number;
        prompt: string;
        type: string;
        is_required: boolean;
        answered_count: number;
        response_rate: number;
        distribution: Array<{
            label: string;
            count: number;
            percentage: number;
        }>;
        recent_answers: Array<{
            respondent: string;
            answer: string;
            submitted_at: string | null;
        }>;
    }>;
};

const COHORT_YEAR_OPTIONS = [
    2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018,
];

export function SurveyCenter({
    role,
    createOpen,
    onCloseCreate,
}: {
    role: WorkspaceRole;
    createOpen: boolean;
    onCloseCreate: () => void;
}) {
    const canManage = role === 'Administrator' || role === 'Alumni coordinator';
    const canViewAnalytics =
        canManage || role === 'Department coordinator';
    const canRespond = role === 'Alumni';
    const meRes = useApiResource<ApiEnvelope<AlumniProfile>>(
        canRespond ? '/api/me/alumni' : null,
    );
    const alumniProfile = meRes.data?.data;
    const isProfileComplete = Boolean(alumniProfile?.is_complete);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const { data, loading, error, reload } =
        useApiResource<ApiEnvelope<RawPagination<Survey>>>('/api/surveys');
    const departmentsRes = useApiResource<ApiEnvelope<AcademicDepartment[]>>(
        canManage ? '/api/departments' : null,
    );
    const programsRes = useApiResource<ApiEnvelope<AcademicProgram[]>>(
        canManage ? '/api/programs' : null,
    );

    const [builderTab, setBuilderTab] = useState<
        'questions' | 'settings' | 'preview'
    >('questions');
    const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
    const [editingSurveyId, setEditingSurveyId] = useState<number | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startsAt, setStartsAt] = useState('');
    const [closesAt, setClosesAt] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [targetSpecificCohorts, setTargetSpecificCohorts] = useState(false);
    const [targetDepartmentIds, setTargetDepartmentIds] = useState<number[]>(
        [],
    );
    const [targetProgramIds, setTargetProgramIds] = useState<number[]>([]);
    const [targetGraduationYears, setTargetGraduationYears] = useState<
        number[]
    >([]);
    const [customYearInput, setCustomYearInput] = useState('');
    const [questions, setQuestions] = useState<QuestionDraft[]>([
        {
            prompt: '',
            type: 'radio',
            options: 'Option 1, Option 2',
            optionsList: ['Option 1', 'Option 2'],
            is_required: true,
        },
    ]);

    const [creating, setCreating] = useState(false);
    const [publishing, setPublishing] = useState<number | null>(null);
    const [closing, setClosing] = useState<number | null>(null);
    const [activeAnalyticsId, setActiveAnalyticsId] = useState<number | null>(
        null,
    );
    const [analyticsData, setAnalyticsData] =
        useState<SurveyAnalyticsPayload | null>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    function resetBuilder() {
        setBuilderTab('questions');
        setActiveQuestionIdx(0);
        setEditingSurveyId(null);
        setTitle('');
        setDescription('');
        setStartsAt('');
        setClosesAt('');
        setIsAnonymous(false);
        setTargetSpecificCohorts(false);
        setTargetDepartmentIds([]);
        setTargetProgramIds([]);
        setTargetGraduationYears([]);
        setCustomYearInput('');
        setQuestions([
            {
                prompt: '',
                type: 'radio',
                options: 'Option 1, Option 2',
                optionsList: ['Option 1', 'Option 2'],
                is_required: true,
            },
        ]);
    }

    function openEditSurvey(survey: Survey) {
        setBuilderTab('questions');
        setActiveQuestionIdx(0);
        setEditingSurveyId(survey.id);
        setTitle(survey.title);
        setDescription(survey.description ?? '');
        setStartsAt(survey.starts_at ? survey.starts_at.slice(0, 10) : '');
        setClosesAt(survey.closes_at ? survey.closes_at.slice(0, 10) : '');
        setIsAnonymous(Boolean(survey.is_anonymous));
        const hasTargeting = Boolean(
            survey.target_department_ids?.length ||
            survey.target_program_ids?.length ||
            survey.target_graduation_years?.length,
        );
        setTargetSpecificCohorts(hasTargeting);
        setTargetDepartmentIds(survey.target_department_ids ?? []);
        setTargetProgramIds(survey.target_program_ids ?? []);
        setTargetGraduationYears(survey.target_graduation_years ?? []);
        setQuestions(
            survey.questions.length
                ? survey.questions.map((q) => {
                    const list =
                        q.options && q.options.length
                            ? [...q.options]
                            : ['Option 1'];
                    return {
                        prompt: q.prompt,
                        type: q.type,
                        options: list.join(', '),
                        optionsList: list,
                        is_required: q.is_required,
                    };
                })
                : [
                    {
                        prompt: '',
                        type: 'radio',
                        options: 'Option 1, Option 2',
                        optionsList: ['Option 1', 'Option 2'],
                        is_required: true,
                    },
                ],
        );
    }

    function updateQuestion(index: number, patch: Partial<QuestionDraft>) {
        setQuestions((current) =>
            current.map((item, idx) => {
                if (idx !== index) return item;
                const updated = { ...item, ...patch };
                if (
                    patch.type &&
                    requiresQuestionOptions(patch.type) &&
                    updated.optionsList.length === 0
                ) {
                    updated.optionsList = ['Option 1'];
                    updated.options = 'Option 1';
                }
                return updated;
            }),
        );
    }

    function updateQuestionOptionItem(
        questionIndex: number,
        optionIndex: number,
        value: string,
    ) {
        setQuestions((current) =>
            current.map((item, idx) => {
                if (idx !== questionIndex) return item;
                const nextList = item.optionsList.map((opt, oIdx) =>
                    oIdx === optionIndex ? value : opt,
                );
                return {
                    ...item,
                    optionsList: nextList,
                    options: nextList.join(', '),
                };
            }),
        );
    }

    function addQuestionOptionItem(questionIndex: number) {
        setQuestions((current) =>
            current.map((item, idx) => {
                if (idx !== questionIndex) return item;
                const nextList = [
                    ...item.optionsList,
                    `Option ${item.optionsList.length + 1}`,
                ];
                return {
                    ...item,
                    optionsList: nextList,
                    options: nextList.join(', '),
                };
            }),
        );
    }

    function removeQuestionOptionItem(
        questionIndex: number,
        optionIndex: number,
    ) {
        setQuestions((current) =>
            current.map((item, idx) => {
                if (idx !== questionIndex || item.optionsList.length <= 1) {
                    return item;
                }
                const nextList = item.optionsList.filter(
                    (_, oIdx) => oIdx !== optionIndex,
                );
                return {
                    ...item,
                    optionsList: nextList,
                    options: nextList.join(', '),
                };
            }),
        );
    }

    function addQuestion() {
        setQuestions((current) => {
            const next = [
                ...current,
                {
                    prompt: '',
                    type: 'radio',
                    options: 'Option 1, Option 2',
                    optionsList: ['Option 1', 'Option 2'],
                    is_required: true,
                },
            ];
            setActiveQuestionIdx(next.length - 1);
            return next;
        });
    }

    function duplicateQuestion(index: number) {
        setQuestions((current) => {
            const copy = [...current];
            const source = current[index];
            const clone: QuestionDraft = {
                ...source,
                optionsList: [...source.optionsList],
            };
            copy.splice(index + 1, 0, clone);
            setActiveQuestionIdx(index + 1);
            return copy;
        });
    }

    function removeQuestion(index: number) {
        setQuestions((current) =>
            current.length > 1
                ? current.filter((_, idx) => idx !== index)
                : current,
        );
    }

    function moveQuestion(index: number, direction: -1 | 1) {
        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= questions.length) {
            return;
        }
        setQuestions((current) => {
            const copy = [...current];
            const [item] = copy.splice(index, 1);
            copy.splice(nextIndex, 0, item);
            setActiveQuestionIdx(nextIndex);
            return copy;
        });
    }

    function toggleId(list: number[], id: number): number[] {
        return list.includes(id)
            ? list.filter((item) => item !== id)
            : [...list, id];
    }

    function addCustomBatchYear() {
        const parsed = Number.parseInt(customYearInput.trim(), 10);
        if (Number.isNaN(parsed) || parsed < 1950 || parsed > 2100) {
            toast.error('Enter a valid graduation year between 1950 and 2100.');
            return;
        }
        if (!targetGraduationYears.includes(parsed)) {
            setTargetGraduationYears((curr) =>
                [...curr, parsed].sort((a, b) => b - a),
            );
        }
        setCustomYearInput('');
    }

    async function saveSurvey(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setCreating(true);

        const formattedQuestions = questions.map((q, index) => {
            const fromList = q.optionsList
                .map((opt) => opt.trim())
                .filter(Boolean);
            const fromString = q.options
                .split(',')
                .map((opt) => opt.trim())
                .filter(Boolean);
            const parsedOptions = fromList.length ? fromList : fromString;

            return {
                prompt: q.prompt,
                type: q.type,
                options: requiresQuestionOptions(q.type) ? parsedOptions : null,
                is_required: q.is_required,
                position: index,
            };
        });

        const payload = {
            title,
            description: description || null,
            starts_at: startsAt || null,
            closes_at: closesAt || null,
            is_anonymous: isAnonymous,
            target_department_ids: targetSpecificCohorts
                ? targetDepartmentIds
                : null,
            target_program_ids: targetSpecificCohorts ? targetProgramIds : null,
            target_graduation_years: targetSpecificCohorts
                ? targetGraduationYears
                : null,
            questions: formattedQuestions,
        };

        try {
            if (editingSurveyId !== null) {
                await apiRequest<ApiEnvelope<Survey>>(
                    `/api/surveys/${editingSurveyId}`,
                    {
                        method: 'PATCH',
                        body: payload,
                    },
                );
                toast.success('Survey updated.');
            } else {
                await apiRequest<ApiEnvelope<Survey>>('/api/surveys', {
                    method: 'POST',
                    body: payload,
                });
                toast.success('Survey created as a draft.');
            }
            resetBuilder();
            onCloseCreate();
            reload();
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Survey could not be saved.',
            );
        } finally {
            setCreating(false);
        }
    }

    async function publishSurvey(id: number) {
        setPublishing(id);
        try {
            await apiRequest<ApiEnvelope<Survey>>(
                `/api/surveys/${id}/publish`,
                { method: 'POST' },
            );
            reload();
            toast.success('Survey published.');
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Survey could not be published.',
            );
        } finally {
            setPublishing(null);
        }
    }

    async function closeSurvey(id: number) {
        setClosing(id);
        try {
            await apiRequest<ApiEnvelope<Survey>>(`/api/surveys/${id}/close`, {
                method: 'POST',
            });
            reload();
            toast.success('Survey closed.');
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Survey could not be closed.',
            );
        } finally {
            setClosing(null);
        }
    }

    async function toggleAnalytics(surveyId: number) {
        if (activeAnalyticsId === surveyId) {
            setActiveAnalyticsId(null);
            setAnalyticsData(null);
            return;
        }
        setActiveAnalyticsId(surveyId);
        setAnalyticsLoading(true);
        try {
            const response = await apiRequest<
                ApiEnvelope<SurveyAnalyticsPayload>
            >(`/api/surveys/${surveyId}/analytics`);
            setAnalyticsData(response.data);
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Survey analytics could not be loaded.',
            );
            setActiveAnalyticsId(null);
        } finally {
            setAnalyticsLoading(false);
        }
    }

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} />;
    }

    const surveys = data?.data.data ?? [];
    const departments = departmentsRes.data?.data ?? [];
    const programs = programsRes.data?.data ?? [];
    const builderVisible = canManage && (createOpen || editingSurveyId !== null);

    return (
        <div className="space-y-4">
            {builderVisible ? (
                <form
                    onSubmit={saveSurvey}
                    className="mx-auto max-w-4xl space-y-4 rounded-2xl border border-[#dfe5dc] bg-[#f1f4ef] p-4 sm:p-6"
                >
                    {/* Survey Builder Top Navigation Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e2e7df] bg-white px-4 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2.5">
                            <span className="grid size-8 place-items-center rounded-lg bg-[#2b5139] text-xs font-bold text-white">
                                SB
                            </span>
                            <div>
                                <p className="text-xs font-bold text-[#29382e]">
                                    {title.trim() || 'Untitled Tracer Survey'}
                                </p>
                                <p className="text-[10px] text-[#7a8278]">
                                    {editingSurveyId !== null
                                        ? 'Editing Draft Survey'
                                        : 'Visual Survey Builder & Dynamic Question Engine'}{' '}
                                    · {questions.length}{' '}
                                    {questions.length === 1
                                        ? 'Question'
                                        : 'Questions'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 rounded-lg bg-[#f3f5f1] p-1">
                            {(
                                [
                                    ['questions', 'Questions'],
                                    ['settings', 'Settings & Cohorts'],
                                    ['preview', 'Preview Form'],
                                ] as const
                            ).map(([tabKey, tabLabel]) => (
                                <button
                                    key={tabKey}
                                    type="button"
                                    onClick={() => setBuilderTab(tabKey)}
                                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${builderTab === tabKey
                                        ? 'bg-white text-[#2b5139] shadow-2xs'
                                        : 'text-[#626c61] hover:text-[#29382e]'
                                        }`}
                                >
                                    {tabLabel}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    resetBuilder();
                                    onCloseCreate();
                                }}
                                className="h-8 rounded-lg border border-[#e3e7df] bg-white px-3 text-xs font-medium text-[#687267] hover:bg-[#f6f7f4]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={creating}
                                className="h-8 rounded-lg bg-[#2b5139] px-4 text-xs font-semibold text-white shadow-2xs hover:bg-[#21402c] disabled:opacity-60"
                            >
                                {creating
                                    ? 'Saving…'
                                    : editingSurveyId !== null
                                        ? 'Save changes'
                                        : 'Create survey'}
                            </button>
                        </div>
                    </div>

                    {/* Google Forms Header Card (Always mounted for form validation) */}
                    <div className="rounded-xl border border-[#dce3d9] border-t-8 border-t-[#2b5139] bg-white p-5 shadow-2xs">
                        <label className="block text-[11px] font-semibold tracking-wider text-[#667367] uppercase">
                            Survey title
                            <input
                                required
                                value={title}
                                onChange={(event) =>
                                    setTitle(event.target.value)
                                }
                                placeholder="Untitled Tracer Survey"
                                className="mt-1 w-full border-b-2 border-[#e3e7df] bg-transparent pb-2 text-lg font-bold text-[#233127] transition outline-none focus:border-[#2b5139]"
                            />
                        </label>
                        <label className="mt-3 block text-[11px] font-medium text-[#667367]">
                            Form description
                            <textarea
                                value={description}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                                rows={2}
                                placeholder="Form description (explain the purpose of this survey to alumni respondents)…"
                                className="mt-1 w-full border-b border-[#e5e9e2] bg-transparent pb-1.5 text-xs text-[#4d5a4f] transition outline-none focus:border-[#2b5139]"
                            />
                        </label>
                    </div>

                    {/* Settings & Cohort Targeting Card */}
                    <div
                        className={`space-y-4 rounded-xl border border-[#dce3d9] bg-white p-5 shadow-2xs ${builderTab === 'preview' ? 'hidden' : ''
                            }`}
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eff1ed] pb-3">
                            <div>
                                <h3 className="text-xs font-bold tracking-wider text-[#2b5139] uppercase">
                                    Schedule, Privacy & Cohort Targeting
                                </h3>
                                <p className="text-[11px] text-[#758074]">
                                    Configure opening/closing dates, anonymous
                                    mode, and target graduation batches or
                                    programs.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <label className="text-xs font-medium text-[#4d5a4f]">
                                Opens on (optional)
                                <input
                                    type="date"
                                    value={startsAt}
                                    onChange={(event) =>
                                        setStartsAt(event.target.value)
                                    }
                                    className="mt-1.5 h-9 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                                />
                            </label>
                            <label className="text-xs font-medium text-[#4d5a4f]">
                                Closes on
                                <input
                                    type="date"
                                    value={closesAt}
                                    onChange={(event) =>
                                        setClosesAt(event.target.value)
                                    }
                                    className="mt-1.5 h-9 w-full rounded-lg border border-[#e3e7df] px-3 text-xs"
                                />
                            </label>
                            <div className="flex flex-col justify-end gap-2 sm:col-span-2">
                                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[#3b4a3e]">
                                    <input
                                        type="checkbox"
                                        checked={isAnonymous}
                                        onChange={(e) =>
                                            setIsAnonymous(e.target.checked)
                                        }
                                        className="size-4 accent-[#2b5139]"
                                    />
                                    <span>
                                        Collect anonymous responses (mask
                                        respondent names in summaries)
                                    </span>
                                </label>
                                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#2b5139]">
                                    <input
                                        type="checkbox"
                                        checked={targetSpecificCohorts}
                                        onChange={(e) =>
                                            setTargetSpecificCohorts(
                                                e.target.checked,
                                            )
                                        }
                                        className="size-4 accent-[#2b5139]"
                                    />
                                    <span>
                                        Target specific departments, programs,
                                        or graduating batches
                                    </span>
                                </label>
                            </div>
                        </div>

                        {targetSpecificCohorts && (
                            <div className="grid gap-4 border-t border-[#e6eae3] pt-4 lg:grid-cols-3">
                                {/* Target Departments */}
                                <div>
                                    <p className="mb-2 text-[11px] font-bold tracking-wider text-[#627063] uppercase">
                                        Target Departments (
                                        {targetDepartmentIds.length || 'All'})
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {departments.map((dept) => {
                                            const active =
                                                targetDepartmentIds.includes(
                                                    dept.id,
                                                );
                                            return (
                                                <button
                                                    key={dept.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setTargetDepartmentIds(
                                                            (curr) =>
                                                                toggleId(
                                                                    curr,
                                                                    dept.id,
                                                                ),
                                                        )
                                                    }
                                                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${active
                                                        ? 'bg-[#2b5139] text-white'
                                                        : 'border border-[#dce2d9] bg-[#f9faf7] text-[#536055]'
                                                        }`}
                                                >
                                                    {dept.code} · {dept.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Target Academic Programs */}
                                <div>
                                    <p className="mb-2 text-[11px] font-bold tracking-wider text-[#627063] uppercase">
                                        Target Academic Programs (
                                        {targetProgramIds.length || 'All'})
                                    </p>
                                    <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                                        {programs.map((prog) => {
                                            const active =
                                                targetProgramIds.includes(
                                                    prog.id,
                                                );
                                            return (
                                                <button
                                                    key={prog.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setTargetProgramIds(
                                                            (curr) =>
                                                                toggleId(
                                                                    curr,
                                                                    prog.id,
                                                                ),
                                                        )
                                                    }
                                                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${active
                                                        ? 'bg-[#2b5139] text-white'
                                                        : 'border border-[#dce2d9] bg-[#f9faf7] text-[#536055]'
                                                        }`}
                                                >
                                                    {prog.code}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Target Graduation Years / Batches */}
                                <div>
                                    <p className="mb-2 text-[11px] font-bold tracking-wider text-[#627063] uppercase">
                                        Target Graduation Batches (
                                        {targetGraduationYears.length || 'All'})
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Array.from(
                                            new Set([
                                                ...COHORT_YEAR_OPTIONS,
                                                ...targetGraduationYears,
                                            ]),
                                        )
                                            .sort((a, b) => b - a)
                                            .map((yr) => {
                                                const active =
                                                    targetGraduationYears.includes(
                                                        yr,
                                                    );
                                                return (
                                                    <button
                                                        key={yr}
                                                        type="button"
                                                        onClick={() =>
                                                            setTargetGraduationYears(
                                                                (curr) =>
                                                                    toggleId(
                                                                        curr,
                                                                        yr,
                                                                    ),
                                                            )
                                                        }
                                                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${active
                                                            ? 'bg-[#2b5139] text-white'
                                                            : 'border border-[#dce2d9] bg-[#f9faf7] text-[#536055]'
                                                            }`}
                                                    >
                                                        {yr}
                                                    </button>
                                                );
                                            })}
                                    </div>
                                    <div className="mt-2 flex gap-1.5">
                                        <input
                                            type="number"
                                            min={1950}
                                            max={2100}
                                            value={customYearInput}
                                            onChange={(e) =>
                                                setCustomYearInput(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Add year (e.g. 2015)"
                                            className="h-8 flex-1 rounded-lg border border-[#dce2d9] bg-white px-2.5 text-xs"
                                        />
                                        <button
                                            type="button"
                                            onClick={addCustomBatchYear}
                                            className="h-8 rounded-lg border border-[#dce2d9] bg-white px-3 text-[11px] font-semibold text-[#2b5139] hover:bg-[#edf2eb]"
                                        >
                                            Add Batch
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Google Forms Live Preview Mode */}
                    {builderTab === 'preview' && (
                        <div className="space-y-3 rounded-xl border border-[#dce3d9] bg-white p-5">
                            <div className="flex items-center justify-between border-b border-[#eff1ed] pb-3">
                                <span className="text-xs font-bold text-[#2b5139] uppercase">
                                    Live Respondent Form Preview
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setBuilderTab('questions')}
                                    className="text-xs font-semibold text-[#2b5139] hover:underline"
                                >
                                    ← Back to editing questions
                                </button>
                            </div>
                            {questions.map((q, qIdx) => (
                                <div
                                    key={qIdx}
                                    className="rounded-xl border border-[#e3e7df] bg-[#fafbf9] p-4"
                                >
                                    <p className="text-xs font-semibold text-[#233127]">
                                        {qIdx + 1}.{' '}
                                        {q.prompt || 'Untitled Question'}
                                        {q.is_required && (
                                            <span className="ml-1 text-[#c93b2b]">
                                                *
                                            </span>
                                        )}
                                    </p>
                                    <p className="mt-1 text-[11px] text-[#7a8278]">
                                        Format:{' '}
                                        {QUESTION_TYPE_LABELS[q.type] ?? q.type}
                                        {requiresQuestionOptions(q.type)
                                            ? ` · Choices: ${q.optionsList.join(', ')}`
                                            : ''}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Google Forms Question Cards Stream */}
                    <div
                        className={`space-y-3.5 ${builderTab === 'preview' ? 'hidden' : ''
                            }`}
                    >
                        {questions.map((question, index) => {
                            const isFocused = activeQuestionIdx === index;
                            const isChoice = requiresQuestionOptions(
                                question.type,
                            );

                            return (
                                <div
                                    key={index}
                                    onClick={() => setActiveQuestionIdx(index)}
                                    className={`rounded-xl border bg-white p-5 shadow-2xs transition ${isFocused
                                        ? 'border-[#cad5c6] border-l-4 border-l-[#2b5139]'
                                        : 'border-[#e3e7df]'
                                        }`}
                                >
                                    <div className="grid gap-3 sm:grid-cols-[1fr_230px]">
                                        <label className="text-xs font-medium text-[#4d5a4f]">
                                            {index === 0
                                                ? 'First question'
                                                : `Question #${index + 1}`}
                                            <input
                                                required
                                                value={question.prompt}
                                                onChange={(event) =>
                                                    updateQuestion(index, {
                                                        prompt: event.target
                                                            .value,
                                                    })
                                                }
                                                placeholder="Question"
                                                className="mt-1.5 h-11 w-full rounded-t-lg border-b-2 border-[#d5ddd2] bg-[#f8faf7] px-3.5 text-sm font-medium text-[#233127] transition outline-none focus:border-[#2b5139] focus:bg-[#f1f5ef]"
                                            />
                                        </label>

                                        <label className="text-xs font-medium text-[#4d5a4f]">
                                            Question type
                                            <select
                                                value={question.type}
                                                onChange={(event) =>
                                                    updateQuestion(index, {
                                                        type: event.target
                                                            .value,
                                                    })
                                                }
                                                className="mt-1.5 h-11 w-full rounded-lg border border-[#d5ddd2] bg-white px-3 text-xs font-semibold text-[#29382e] outline-none focus:border-[#2b5139]"
                                            >
                                                {BUILDER_QUESTION_TYPES.map(
                                                    (typeOption) => (
                                                        <option
                                                            key={
                                                                typeOption.value
                                                            }
                                                            value={
                                                                typeOption.value
                                                            }
                                                        >
                                                            {typeOption.label}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </label>
                                    </div>

                                    {/* Google Forms Interactive Answer Area */}
                                    <div className="mt-4">
                                        {isChoice ? (
                                            <div className="space-y-2">
                                                {question.optionsList.map(
                                                    (optVal, optIdx) => (
                                                        <div
                                                            key={optIdx}
                                                            className="flex items-center gap-2.5"
                                                        >
                                                            <span className="w-5 text-center text-xs font-bold text-[#838c81]">
                                                                {question.type ===
                                                                    'radio'
                                                                    ? '○'
                                                                    : question.type ===
                                                                        'multiselect'
                                                                        ? '☐'
                                                                        : `${optIdx + 1}.`}
                                                            </span>
                                                            <input
                                                                type="text"
                                                                required
                                                                value={optVal}
                                                                onChange={(e) =>
                                                                    updateQuestionOptionItem(
                                                                        index,
                                                                        optIdx,
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder={`Option ${optIdx + 1}`}
                                                                className="h-9 flex-1 border-b border-transparent bg-transparent px-1 text-xs text-[#29382e] transition outline-none hover:border-[#dce2d9] focus:border-b-2 focus:border-[#2b5139]"
                                                            />
                                                            {question
                                                                .optionsList
                                                                .length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            removeQuestionOptionItem(
                                                                                index,
                                                                                optIdx,
                                                                            )
                                                                        }
                                                                        title="Remove option"
                                                                        className="rounded p-1 text-xs text-[#8a9289] hover:bg-[#f2f4f0] hover:text-[#8b4e43]"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                )}
                                                        </div>
                                                    ),
                                                )}

                                                <div className="flex flex-wrap items-center gap-3 pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            addQuestionOptionItem(
                                                                index,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2b5139] hover:underline"
                                                    >
                                                        <span>
                                                            {question.type ===
                                                                'radio'
                                                                ? '○'
                                                                : question.type ===
                                                                    'multiselect'
                                                                    ? '☐'
                                                                    : '+'}
                                                        </span>
                                                        <span>Add option</span>
                                                    </button>
                                                </div>

                                                <label className="mt-2 block text-[11px] font-medium text-[#7a8278]">
                                                    Answer choices (comma
                                                    separated quick-fill)
                                                    <input
                                                        value={question.options}
                                                        onChange={(event) => {
                                                            const raw =
                                                                event.target
                                                                    .value;
                                                            const split = raw
                                                                .split(',')
                                                                .map((s) =>
                                                                    s.trim(),
                                                                )
                                                                .filter(
                                                                    Boolean,
                                                                );
                                                            updateQuestion(
                                                                index,
                                                                {
                                                                    options:
                                                                        raw,
                                                                    optionsList:
                                                                        split.length
                                                                            ? split
                                                                            : [
                                                                                '',
                                                                            ],
                                                                },
                                                            );
                                                        }}
                                                        placeholder="e.g., Very Relevant, Moderately Relevant, Not Relevant"
                                                        className="mt-1 h-8 w-full rounded-lg border border-[#e6eae3] bg-[#fafbf9] px-2.5 text-[11px] text-[#4d5a4f]"
                                                    />
                                                </label>
                                            </div>
                                        ) : question.type === 'text' ? (
                                            <div className="max-w-xs border-b border-dotted border-[#b8c2b6] pb-1.5 text-xs text-[#8a9289]">
                                                Short answer text
                                            </div>
                                        ) : question.type === 'textarea' ? (
                                            <div className="max-w-lg border-b border-dotted border-[#b8c2b6] pb-4 text-xs text-[#8a9289]">
                                                Long answer paragraph text
                                            </div>
                                        ) : question.type === 'rating' ? (
                                            <div className="flex items-center gap-4 py-1 text-xs text-[#687267]">
                                                <span>Linear scale:</span>
                                                {[1, 2, 3, 4, 5].map((n) => (
                                                    <span
                                                        key={n}
                                                        className="inline-flex size-7 items-center justify-center rounded-full border border-[#d5ddd2] bg-[#fafbf9] font-semibold"
                                                    >
                                                        {n}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : question.type === 'boolean' ? (
                                            <div className="flex gap-3 text-xs text-[#687267]">
                                                <span className="rounded-lg border border-[#e3e7df] bg-[#fafbf9] px-3 py-1">
                                                    ○ Yes
                                                </span>
                                                <span className="rounded-lg border border-[#e3e7df] bg-[#fafbf9] px-3 py-1">
                                                    ○ No
                                                </span>
                                            </div>
                                        ) : question.type === 'date' ? (
                                            <div className="max-w-[180px] border-b border-dotted border-[#b8c2b6] pb-1.5 text-xs text-[#8a9289]">
                                                Month, day, year 📅
                                            </div>
                                        ) : (
                                            <div className="max-w-[180px] border-b border-dotted border-[#b8c2b6] pb-1.5 text-xs text-[#8a9289]">
                                                Numeric value (0–9)
                                            </div>
                                        )}
                                    </div>

                                    {/* Google Forms Bottom Card Action Toolbar */}
                                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#eff1ed] pt-3">
                                        <span className="text-[11px] font-medium text-[#7a8278]">
                                            Question {index + 1} of{' '}
                                            {questions.length}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                disabled={index === 0}
                                                onClick={() =>
                                                    moveQuestion(index, -1)
                                                }
                                                title="Move question up"
                                                className="rounded-lg border border-[#e3e7df] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#536055] hover:bg-[#f4f6f2] disabled:opacity-40"
                                            >
                                                ↑
                                            </button>
                                            <button
                                                type="button"
                                                disabled={
                                                    index ===
                                                    questions.length - 1
                                                }
                                                onClick={() =>
                                                    moveQuestion(index, 1)
                                                }
                                                title="Move question down"
                                                className="rounded-lg border border-[#e3e7df] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#536055] hover:bg-[#f4f6f2] disabled:opacity-40"
                                            >
                                                ↓
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    duplicateQuestion(index)
                                                }
                                                className="rounded-lg border border-[#e3e7df] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#4d5a4f] hover:bg-[#f4f6f2]"
                                            >
                                                Duplicate
                                            </button>
                                            {questions.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeQuestion(index)
                                                    }
                                                    className="rounded-lg border border-[#ecd8d2] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#8b4e43] hover:bg-[#fcf5f3]"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                            <div className="mx-1 h-4 w-px bg-[#e3e7df]" />
                                            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[#4d5a4f]">
                                                <span>Required</span>
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        question.is_required
                                                    }
                                                    onChange={(e) =>
                                                        updateQuestion(index, {
                                                            is_required:
                                                                e.target
                                                                    .checked,
                                                        })
                                                    }
                                                    className="size-4 accent-[#2b5139]"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Google Forms Floating-Style Bottom Add Bar */}
                        <div className="flex items-center justify-between rounded-xl border border-[#dce3d9] bg-white px-4 py-3 shadow-2xs">
                            <button
                                type="button"
                                onClick={addQuestion}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#edf2eb] px-4 text-xs font-bold text-[#2b5139] transition hover:bg-[#dfe8dc]"
                            >
                                ⊕ Add question
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        resetBuilder();
                                        onCloseCreate();
                                    }}
                                    className="h-9 rounded-lg border border-[#e3e7df] px-3 text-xs font-medium text-[#687267]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="h-9 rounded-lg bg-[#2b5139] px-5 text-xs font-semibold text-white shadow-xs hover:bg-[#21402c] disabled:opacity-60"
                                >
                                    {creating
                                        ? 'Saving…'
                                        : editingSurveyId !== null
                                            ? 'Save changes'
                                            : 'Create survey'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            ) : null}

            {surveys.length ? (
                surveys.map((survey) => {
                    const hasCohortRules = Boolean(
                        survey.target_department_ids?.length ||
                        survey.target_program_ids?.length ||
                        survey.target_graduation_years?.length,
                    );

                    return (
                        <article
                            key={survey.id}
                            className="rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:p-5"
                        >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-sm font-semibold text-[#39463b]">
                                            {survey.title}
                                        </h2>
                                        <span className="rounded-full bg-[#f2f3ef] px-2.5 py-1 text-[10px] font-medium text-[#697367] capitalize">
                                            {survey.status}
                                        </span>
                                        {survey.is_anonymous && (
                                            <span className="rounded-full bg-[#edf2eb] px-2.5 py-1 text-[10px] font-semibold text-[#2b5139]">
                                                Anonymous
                                            </span>
                                        )}
                                        {survey.responses_count !==
                                            undefined && (
                                                <span className="rounded-full bg-[#f4f5f2] px-2.5 py-1 text-[10px] font-semibold text-[#546055]">
                                                    {survey.responses_count}{' '}
                                                    {survey.responses_count === 1
                                                        ? 'response'
                                                        : 'responses'}
                                                </span>
                                            )}
                                    </div>
                                    {survey.description ? (
                                        <p className="mt-1 text-xs leading-5 text-[#7a8278]">
                                            {survey.description}
                                        </p>
                                    ) : null}

                                    {/* Cohort & Schedule Badges */}
                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-[#7c847a]">
                                        <span className="rounded bg-[#f6f7f4] px-2 py-0.5 font-medium">
                                            {hasCohortRules
                                                ? [
                                                    survey
                                                        .target_department_ids
                                                        ?.length
                                                        ? `${survey.target_department_ids.length} dept(s)`
                                                        : null,
                                                    survey.target_program_ids
                                                        ?.length
                                                        ? `${survey.target_program_ids.length} program(s)`
                                                        : null,
                                                    survey
                                                        .target_graduation_years
                                                        ?.length
                                                        ? `Batches: ${survey.target_graduation_years.join(', ')}`
                                                        : null,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' · ')
                                                : 'All alumni cohorts'}
                                        </span>
                                        {survey.starts_at && (
                                            <span>
                                                Opens{' '}
                                                {new Date(
                                                    survey.starts_at,
                                                ).toLocaleDateString()}
                                            </span>
                                        )}
                                        {survey.closes_at && (
                                            <span>
                                                Closes{' '}
                                                {new Date(
                                                    survey.closes_at,
                                                ).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {canViewAnalytics && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void toggleAnalytics(survey.id)
                                            }
                                            className="rounded-lg border border-[#e3e7df] bg-[#fafbf9] px-3 py-2 text-[11px] font-semibold text-[#3f5242] hover:bg-[#eff2ed]"
                                        >
                                            {activeAnalyticsId === survey.id
                                                ? 'Hide analytics'
                                                : 'Analytics'}
                                        </button>
                                    )}
                                    {canManage &&
                                        (survey.responses_count ?? 0) === 0 && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openEditSurvey(survey)
                                                }
                                                className="rounded-lg border border-[#e3e7df] bg-white px-3 py-2 text-[11px] font-semibold text-[#526054] hover:bg-[#f6f7f4]"
                                            >
                                                Edit
                                            </button>
                                        )}
                                    {canManage && survey.status === 'draft' ? (
                                        <button
                                            type="button"
                                            disabled={publishing === survey.id}
                                            onClick={() =>
                                                void publishSurvey(survey.id)
                                            }
                                            className="rounded-lg bg-[#2b5139] px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-60"
                                        >
                                            {publishing === survey.id
                                                ? 'Publishing…'
                                                : 'Publish'}
                                        </button>
                                    ) : null}
                                    {canManage &&
                                        survey.status === 'published' ? (
                                        <button
                                            type="button"
                                            disabled={closing === survey.id}
                                            onClick={() =>
                                                void closeSurvey(survey.id)
                                            }
                                            className="rounded-lg border border-[#ecd8d2] bg-white px-3 py-2 text-[11px] font-semibold text-[#8b4e43] disabled:opacity-60"
                                        >
                                            {closing === survey.id
                                                ? 'Closing…'
                                                : 'Close survey'}
                                        </button>
                                    ) : null}
                                </div>
                            </div>

                            {canManage ? (
                                <ul className="mt-3 space-y-1 border-t border-[#eff0ec] pt-3">
                                    {survey.questions.map((question, qIdx) => (
                                        <li
                                            key={question.id}
                                            className="text-[11px] text-[#6f786e]"
                                        >
                                            {qIdx + 1}. {question.prompt}{' '}
                                            <span className="text-[#969c94]">
                                                ·{' '}
                                                {QUESTION_TYPE_LABELS[
                                                    question.type
                                                ] ?? question.type}
                                                {question.is_required
                                                    ? ' (Required)'
                                                    : ' (Optional)'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : canRespond && !isProfileComplete ? (
                                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs">
                                    <div className="flex items-center gap-2 font-bold text-amber-950">
                                        <Lock className="size-4 text-[#E47818]" />
                                        Profile Completion Required to Participate
                                    </div>
                                    <p className="mt-1 text-[11px] text-amber-900/80 leading-relaxed">
                                        Please complete your alumni profile (gender, civil status, contact number, current address, and permanent address) before answering surveys.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setProfileModalOpen(true)}
                                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#E47818] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#c96611] cursor-pointer"
                                    >
                                        <Pencil className="size-3" />
                                        Complete Profile to Answer Survey
                                    </button>
                                </div>
                            ) : canRespond && survey.has_responded ? (
                                <p className="mt-3 border-t border-[#eff0ec] pt-3 text-xs font-medium text-[#587057]">
                                    Your response has been submitted.
                                </p>
                            ) : canRespond ? (
                                <SurveyResponseForm
                                    survey={survey}
                                    onSubmitted={reload}
                                />
                            ) : (
                                <ul className="mt-3 space-y-1 border-t border-[#eff0ec] pt-3">
                                    {survey.questions.map((question, qIdx) => (
                                        <li
                                            key={question.id}
                                            className="text-[11px] text-[#6f786e]"
                                        >
                                            {qIdx + 1}. {question.prompt}{' '}
                                            <span className="text-[#969c94]">
                                                ·{' '}
                                                {QUESTION_TYPE_LABELS[
                                                    question.type
                                                ] ?? question.type}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* Inline Survey Analytics Breakdown */}
                            {activeAnalyticsId === survey.id && (
                                <div className="mt-4 rounded-xl border border-[#dfe6dc] bg-[#f8faf7] p-4">
                                    {analyticsLoading ? (
                                        <p className="text-xs text-[#6e776d]">
                                            Loading survey response analytics…
                                        </p>
                                    ) : analyticsData ? (
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5eae2] pb-2.5">
                                                <h3 className="text-xs font-bold text-[#2b5139] uppercase">
                                                    Response Analytics ·{' '}
                                                    {
                                                        analyticsData.total_responses
                                                    }{' '}
                                                    Total Submissions
                                                </h3>
                                                <span className="text-[11px] text-[#687267]">
                                                    {analyticsData.is_anonymous
                                                        ? 'Anonymous mode active'
                                                        : 'Identifiable responses'}
                                                </span>
                                            </div>
                                            <div className="grid gap-3 md:grid-cols-2">
                                                {analyticsData.questions.map(
                                                    (q) => (
                                                        <div
                                                            key={q.id}
                                                            className="rounded-xl border border-[#e6eae3] bg-white p-3.5"
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <p className="text-xs font-semibold text-[#314034]">
                                                                    {q.prompt}
                                                                </p>
                                                                <span className="shrink-0 text-[10px] font-medium text-[#69866c]">
                                                                    {
                                                                        q.answered_count
                                                                    }{' '}
                                                                    answered (
                                                                    {
                                                                        q.response_rate
                                                                    }
                                                                    %)
                                                                </span>
                                                            </div>
                                                            {q.distribution
                                                                .length > 0 ? (
                                                                <div className="mt-2.5 space-y-1.5">
                                                                    {q.distribution.map(
                                                                        (d) => (
                                                                            <div
                                                                                key={
                                                                                    d.label
                                                                                }
                                                                                className="text-[11px]"
                                                                            >
                                                                                <div className="flex justify-between text-[#556156]">
                                                                                    <span className="truncate">
                                                                                        {
                                                                                            d.label
                                                                                        }
                                                                                    </span>
                                                                                    <span className="font-semibold">
                                                                                        {
                                                                                            d.count
                                                                                        }{' '}
                                                                                        (
                                                                                        {
                                                                                            d.percentage
                                                                                        }
                                                                                        %)
                                                                                    </span>
                                                                                </div>
                                                                                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#eef1ec]">
                                                                                    <div
                                                                                        className="h-full rounded-full bg-[#4b7254]"
                                                                                        style={{
                                                                                            width: `${Math.min(100, d.percentage)}%`,
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <p className="mt-2 text-[11px] text-[#8a9289]">
                                                                    No responses
                                                                    recorded for
                                                                    this
                                                                    question
                                                                    yet.
                                                                </p>
                                                            )}
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </article>
                    );
                })
            ) : (
                <EmptyState>
                    {canManage
                        ? 'No surveys have been created yet.'
                        : 'There are no open surveys right now.'}
                </EmptyState>
            )}

            <AlumniProfileCompletionModal
                isOpen={profileModalOpen}
                onClose={() => setProfileModalOpen(false)}
                profile={alumniProfile}
                onSuccess={() => meRes.reload()}
            />
        </div>
    );
}
