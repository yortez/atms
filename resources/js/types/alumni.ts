export type EducationRecord = {
    id: number;
    student_number: string;
    graduation_year: number | null;
    honors: string | null;
    gwa?: number | string | null;
    program: string | null;
    degree: string | null;
};

export type EmploymentStatus = {
    id: number;
    code: string;
    label: string;
};

export type EmploymentRecord = {
    id: number;
    employment_status_id: number;
    employer_name: string | null;
    job_title: string | null;
    industry: string | null;
    employment_type: string | null;
    work_location: string | null;
    is_related_to_degree?: boolean;
    started_on: string | null;
    ended_on: string | null;
    reported_at: string;
    status: EmploymentStatus;
};

export type EmploymentSummary = {
    id: number;
    status: string | null;
    employer_name: string | null;
    job_title: string | null;
    industry: string | null;
    employment_type: string | null;
    work_location: string | null;
    is_related_to_degree?: boolean;
    started_on: string | null;
    ended_on: string | null;
    reported_at: string;
};

export type AlumniProfile = {
    id: number;
    name: string;
    preferred_name: string | null;
    first_name: string | null;
    middle_name: string | null;
    last_name: string | null;
    suffix: string | null;
    email: string;
    date_of_birth: string;
    profile_status: 'active' | 'archived';
    avatar?: string | null;
    is_claimed?: boolean;
    claimed_at?: string | null;
    education_records?: EducationRecord[];
    employment_records?: EmploymentSummary[];
};

export type AcademicDepartment = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    programs_count?: number;
    programs?: AcademicProgram[];
};

export type AcademicProgram = {
    id: number;
    department_id: number;
    code: string;
    name: string;
    description: string | null;
    department?: AcademicDepartment;
    program_degrees?: {
        id: number;
        degree: { id: number; title: string; degree_level: string };
    }[];
};

export type UserNotification = {
    id: string;
    type: string;
    data: Record<string, unknown>;
    read_at: string | null;
    created_at: string;
};

export type SurveyQuestionType =
    | 'text'
    | 'short_text'
    | 'textarea'
    | 'long_text'
    | 'radio'
    | 'multiple_choice'
    | 'choice'
    | 'multiselect'
    | 'checkbox'
    | 'select'
    | 'dropdown'
    | 'rating'
    | 'date'
    | 'number'
    | 'boolean'
    | 'yes_no';

export type SurveyQuestion = {
    id: number;
    prompt: string;
    type: SurveyQuestionType;
    options: string[] | null;
    is_required: boolean;
    position: number;
};

export type Survey = {
    id: number;
    title: string;
    description: string | null;
    status: 'draft' | 'published' | 'closed';
    published_at: string | null;
    starts_at?: string | null;
    closes_at: string | null;
    is_anonymous?: boolean;
    target_department_ids?: number[] | null;
    target_program_ids?: number[] | null;
    target_graduation_years?: number[] | null;
    responses_count?: number;
    questions: SurveyQuestion[];
    has_responded?: boolean;
};

export type AnnouncementCategory =
    | 'general'
    | 'event'
    | 'career'
    | 'tracer'
    | 'scholarship'
    | 'urgent';

export type Announcement = {
    id: number;
    title: string;
    body: string;
    category?: AnnouncementCategory;
    is_pinned?: boolean;
    is_public?: boolean;
    action_label?: string | null;
    action_url?: string | null;
    audience_roles: string[] | null;
    target_department_ids?: number[] | null;
    target_program_ids?: number[] | null;
    target_graduation_years?: number[] | null;
    status: 'draft' | 'published' | 'archived';
    published_at: string | null;
    expires_at?: string | null;
    created_at: string;
    author?: {
        id: number;
        name: string;
    } | null;
};

export type AlumniEventType =
    | 'homecoming'
    | 'career_fair'
    | 'networking'
    | 'webinar'
    | 'workshop'
    | 'reunion';

export type AlumniEventFormat = 'in_person' | 'online' | 'hybrid';

export type AlumniEvent = {
    id: number;
    title: string;
    description: string;
    event_type: AlumniEventType;
    format: AlumniEventFormat;
    venue: string | null;
    meeting_url: string | null;
    starts_at: string;
    ends_at: string | null;
    registration_deadline: string | null;
    capacity: number | null;
    is_featured: boolean;
    is_public: boolean;
    audience_roles: string[] | null;
    target_department_ids?: number[] | null;
    target_program_ids?: number[] | null;
    target_graduation_years?: number[] | null;
    status: 'draft' | 'published' | 'cancelled' | 'completed';
    published_at: string | null;
    created_at: string;
    going_count?: number;
    interested_count?: number;
    my_registration_status?: 'going' | 'interested' | null;
    author?: {
        id: number;
        name: string;
    } | null;
};

export type AlumniEventAttendee = {
    id: number;
    user_id: number;
    name: string;
    email: string;
    status: 'going' | 'interested';
    notes: string | null;
    registered_at: string | null;
};

export type Employer = {
    id: number;
    company_name: string;
    website: string | null;
    description: string | null;
    industry: string | null;
    registration_number: string | null;
    contact_email: string;
    contact_phone: string | null;
    address: string | null;
    verification_status: 'pending' | 'verified' | 'rejected' | 'suspended';
};

export type JobPosting = {
    id: number;
    employer_id: number;
    title: string;
    description: string;
    location: string | null;
    employment_type: string | null;
    workplace_type: string | null;
    salary_min: number | null;
    salary_max: number | null;
    status: 'draft' | 'published' | 'closed';
    closes_at: string | null;
    published_at: string | null;
    applications_count?: number;
    employer?: {
        id: number;
        company_name: string;
        industry?: string | null;
        website?: string | null;
    };
};

export type JobApplication = {
    id: number;
    job_posting_id: number;
    alumni_profile_id: number;
    applicant_user_id: number;
    cover_letter: string | null;
    status: string;
    profile_snapshot?: Record<string, any> | null;
    resume_snapshot_path?: string | null;
    reviewed_at: string | null;
    created_at: string;
    job_posting?: Pick<JobPosting, 'id' | 'title' | 'location' | 'status'> & {
        employer?: Pick<Employer, 'id' | 'company_name'>;
    };
    alumni_profile?: Pick<AlumniProfile, 'id' | 'name' | 'email'>;
};

export type RegistrationAssistanceRequest = {
    id: number;
    name: string;
    email: string;
    date_of_birth: string;
    student_number: string;
    academic_program_id: number | null;
    graduation_year?: number | null;
    program?: {
        id: number;
        code: string;
        name: string;
    } | null;
    message: string | null;
    status: 'pending' | 'reviewed' | 'needs_more_information' | 'rejected';
    resolution_action?: 'sync_record' | 'create_record' | 'provision_account' | 'manual_review' | null;
    resolved_alumni_profile_id?: number | null;
    created_at: string;
    reviewed_at: string | null;
    reviewed_by?: {
        id: number;
        name: string;
    } | null;
    review_note: string | null;
    registrar_match?: {
        found: boolean;
        match_status:
            | 'not_found'
            | 'already_claimed'
            | 'ready_to_claim'
            | 'dob_mismatch'
            | 'name_mismatch'
            | 'multiple_mismatches';
        summary: string;
        recommended_action: 'create_record' | 'sync_record' | 'provision_account' | 'manual_review';
        profile: {
            id: number;
            name: string;
            email: string;
            date_of_birth: string | null;
            is_claimed: boolean;
            program_code?: string | null;
            graduation_year?: number | null;
        } | null;
    };
};

export type DashboardStatistics = {
    role: string;
    metrics: {
        alumni_count: number;
        users_count: number;
        survey_count: number;
        survey_response_count: number;
        announcements_published_count: number;
        employers: { total: number; verified: number; pending: number };
        jobs: { total: number; published: number };
        applications: {
            total: number;
            by_status: { status: string; count: number }[];
        };
    };
    employment_outcomes: {
        code: string;
        label: string;
        alumni_count: number;
    }[];
};

export type ActivityLogEntry = {
    id: number;
    action: string;
    subject_type: string | null;
    subject_id: number | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
    actor?: { id: number; name: string } | null;
};
