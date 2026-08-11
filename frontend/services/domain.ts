import { api } from "./apiClient";

// ---------- Auth ----------
export const authService = {
  login: (email: string, password: string) => api.post("/auth/login", { email, password }),
  register: (payload: { email: string; password: string; full_name: string; role: string; organization?: string }) =>
    api.post("/auth/register", payload),
  me: () => api.get("/auth/me"),
};

// ---------- Admin (requires role=admin, enforced server-side) ----------
export const adminService = {
  listUsers: () => api.get("/auth/admin/users"),
  updateUser: (userId: string, payload: { role?: string; is_active?: boolean }) =>
    api.patch(`/auth/admin/users/${userId}`, payload),
  listAuditLogs: () => api.get("/auth/admin/audit-logs"),
};

// ---------- Analytics (dashboard) ----------
export const analyticsService = {
  summary: () => api.get("/analytics/dashboard/summary"),
  pipelineProgress: () => api.get("/analytics/dashboard/pipeline-progress"),
  modelPerformance: () => api.get("/analytics/models/performance"),
};

// ---------- Drug discovery ----------
export const drugService = {
  listDiseases: () => api.get("/drug/diseases"),
  listProteins: (diseaseId?: string) => api.get("/drug/proteins", { params: { disease_id: diseaseId } }),
  screen: (querySmiles: string, topK = 10, minSimilarity = 0.6) =>
    api.post("/drug/screen", { query_smiles: querySmiles, top_k: topK, min_similarity: minSimilarity }),
};

// ---------- Prediction ----------
export const predictionService = {
  predict: (smiles: string) => api.post("/prediction/predict", { smiles }),
  generate: (seedSmiles: string, numVariants = 5) =>
    api.post("/prediction/generate", { seed_smiles: seedSmiles, num_variants: numVariants }),
};

// ---------- Experiments ----------
export const experimentService = {
  list: (projectId?: string) => api.get("/experiment/experiments", { params: { project_id: projectId } }),
  create: (payload: { project_id: string; title: string; protocol?: object }) =>
    api.post("/experiment/experiments", payload),
};

// ---------- Notifications ----------
export const notificationService = {
  list: (unreadOnly = false) => api.get("/notification/notifications", { params: { unread_only: unreadOnly } }),
  markRead: (id: string) => api.post(`/notification/notifications/${id}/read`),
};

// ---------- Reports ----------
export const reportService = {
  generate: (payload: { project_id?: string; title: string; format: "pdf" | "excel"; sections?: object[] }) =>
    api.post("/report/generate", payload),
};

// ---------- Chat (routed through SNS Workbench server-side, see workflow-service) ----------
export const chatService = {
  query: (query: string) => api.post("/workflow/chat/query", { query }),
};

// ---------- Druglikeness (Lipinski/Veber/Ghose — exact, not model output) ----------
export const druglikenessService = {
  evaluate: (smiles: string) => api.post("/prediction/druglikeness", { smiles }),
};

// ---------- Literature (real PubMed via NCBI E-utilities) ----------
export const literatureService = {
  search: (query: string, maxResults = 10) => api.post("/drug/literature", { query, max_results: maxResults }),
};

// ---------- Targets ----------
export const targetService = {
  listProteins: (diseaseId?: string) => api.get("/drug/proteins", { params: { disease_id: diseaseId } }),
  createProtein: (payload: { name: string; uniprot_id?: string; sequence?: string; disease_id?: string }) =>
    api.post("/drug/proteins", payload),
};

// ---------- Docking ----------
export const dockingService = {
  dock: (payload: {
    ligand_smiles: string;
    receptor_pdbqt_path: string;
    center_x: number;
    center_y: number;
    center_z: number;
    box_size_x?: number;
    box_size_y?: number;
    box_size_z?: number;
  }) => api.post("/prediction/dock", payload),
};

// ---------- Clinical recommendation ----------
export const clinicalService = {
  create: (payload: {
    compound_id: string;
    disease_id?: string;
    phase: string;
    patient_cohort?: object;
    admet_score?: number;
    toxicity_score?: number;
  }) => api.post("/drug/clinical-trials", payload),
  list: (compoundId?: string) => api.get("/drug/clinical-trials", { params: { compound_id: compoundId } }),
};

// ---------- Profile ----------
export const profileService = {
  update: (payload: { full_name?: string; organization?: string }) => api.patch("/auth/me", payload),
};
