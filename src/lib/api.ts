function resolveApiBaseUrl() {
  const configured = String(import.meta.env.VITE_API_URL || "").trim();

  if (!configured) {
    return "/api";
  }

  const normalized = configured.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
}

const API_BASE_URL = resolveApiBaseUrl();
const SESSION_STORAGE_KEY = "tech-support-session-token";

export type AuthUser = {
  id: string;
  email: string;
};

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  phone: string;
  recovery_email: string;
  avatar_url: string;
  bio: string;
  company: string;
  created_at: string;
  updated_at: string;
};

export type ConsultationStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type ConsultationNextPath = "service" | "class";
export type ConsultationNextPathStatus = "pending" | "test_in_progress" | "test_completed" | "certification_started";
export type ConsultationOwnerAgreement = "yes" | "no";

export type Consultation = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  status: ConsultationStatus;
  next_path: ConsultationNextPath;
  next_path_status: ConsultationNextPathStatus;
  owner_agreed: ConsultationOwnerAgreement;
  created_at: string;
};

export type LessonAssessmentType = "topic_quiz" | "final_exam";

export type LessonAssessmentRecord = {
  id: string;
  consultation_id: string;
  user_id: string | null;
  course: string;
  session_label: string;
  topic_number: number;
  assessment_type: LessonAssessmentType;
  score: number;
  correct_answers: number;
  total_questions: number;
  read_time_required_seconds: number;
  read_time_completed_at: string | null;
  submitted_at: string;
  updated_at: string;
  consultation_service?: string;
  learner_name?: string;
  learner_email?: string;
};

export type SavedService = {
  id: string;
  service_title: string;
  service_category: string;
  service_description: string;
  saved_at: string;
};

export type PasswordResetRequestResponse = {
  success: boolean;
  fallback?: boolean;
  otp?: string;
  expiresAt?: string;
  deliveryEmailMasked?: string;
};

export type ManualPasswordResetResponse = {
  success: boolean;
  email: string;
  otp: string;
  expiresAt: string;
  ttlMinutes: number;
};

export type CreateConsultationPayload = {
  full_name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  status?: ConsultationStatus;
};

export type UpdateConsultationWorkflowPayload = {
  next_path: ConsultationNextPath;
  next_path_status: ConsultationNextPathStatus;
  owner_agreed: ConsultationOwnerAgreement;
};

export type SaveServicePayload = {
  service_title: string;
  service_category: string;
  service_description: string;
};

export type SaveLessonAssessmentPayload = {
  course: string;
  session_label: string;
  topic_number: number;
  assessment_type: LessonAssessmentType;
  score: number;
  correct_answers: number;
  total_questions: number;
  read_time_required_seconds: number;
  read_time_completed_at: string | null;
};

type AuthResponse = {
  token: string;
  user: AuthUser;
  profile: Profile;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
};

type ApiErrorBody = {
  error?: string;
};

export function getSessionToken() {
  return localStorage.getItem(SESSION_STORAGE_KEY);
}

export function setSessionToken(token: string | null) {
  if (!token) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  localStorage.setItem(SESSION_STORAGE_KEY, token);
}

export function getErrorMessage(error: unknown, fallback = "An unexpected error occurred") {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return fallback;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token = getSessionToken() } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Could not connect to the API. Make sure the backend is running or deployed correctly.");
  }

  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMessage =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as ApiErrorBody).error === "string"
        ? (data as ApiErrorBody).error
        : "Request failed";

    throw new Error(errorMessage);
  }

  return data as T;
}

export const api = {
  signUp(payload: { email: string; password: string; username: string; fullName: string }) {
    return request<AuthResponse>("/auth/signup", {
      method: "POST",
      body: payload,
    });
  },
  signIn(payload: { email: string; password: string }) {
    return request<AuthResponse>("/auth/signin", {
      method: "POST",
      body: payload,
    });
  },
  requestPasswordReset(email: string) {
    return request<PasswordResetRequestResponse>("/auth/password-reset/request", {
      method: "POST",
      body: { email },
    });
  },
  confirmPasswordReset(payload: { email: string; otp: string; password: string }) {
    return request<{ success: boolean }>("/auth/password-reset/confirm", {
      method: "POST",
      body: payload,
    });
  },
  signOut() {
    return request<{ success: boolean }>("/auth/signout", { method: "POST" });
  },
  getMe() {
    return request<{ user: AuthUser; profile: Profile }>("/auth/me");
  },
  updatePassword(password: string) {
    return request<{ success: boolean }>("/auth/password", {
      method: "PATCH",
      body: { password },
    });
  },
  updateProfile(updates: Record<string, unknown>) {
    return request<{ profile: Profile }>("/profile", {
      method: "PATCH",
      body: updates,
    });
  },
  getConsultations() {
    return request<{ consultations: Consultation[] }>("/consultations");
  },
  getAdminConsultations() {
    return request<{ consultations: Consultation[]; ownerEmail: string }>("/admin/consultations");
  },
  getLessonAssessments() {
    return request<{ records: LessonAssessmentRecord[] }>("/lesson-assessments");
  },
  getAdminLessonAssessments() {
    return request<{ records: LessonAssessmentRecord[] }>("/admin/lesson-assessments");
  },
  saveLessonAssessment(consultationId: string, payload: SaveLessonAssessmentPayload) {
    return request<{ record: LessonAssessmentRecord }>(`/consultations/${consultationId}/lesson-assessments`, {
      method: "POST",
      body: payload,
    });
  },
  createManualPasswordReset(email: string) {
    return request<ManualPasswordResetResponse>("/admin/password-reset-otp", {
      method: "POST",
      body: { email },
    });
  },
  createConsultation(payload: CreateConsultationPayload) {
    return request<{ consultation: Consultation }>("/consultations", {
      method: "POST",
      body: payload,
    });
  },
  updateConsultationStatus(id: string, status: ConsultationStatus) {
    return request<{ consultation: Consultation }>(`/admin/consultations/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
  },
  updateConsultationWorkflow(id: string, payload: UpdateConsultationWorkflowPayload) {
    return request<{ consultation: Consultation }>(`/admin/consultations/${id}/workflow`, {
      method: "PATCH",
      body: payload,
    });
  },
  getSavedServices() {
    return request<{ savedServices: SavedService[] }>("/saved-services");
  },
  saveService(payload: SaveServicePayload) {
    return request<{ savedService: SavedService }>("/saved-services", {
      method: "POST",
      body: payload,
    });
  },
  deleteSavedService(id: string) {
    return request<{ success: boolean }>(`/saved-services/${id}`, {
      method: "DELETE",
    });
  },
};
