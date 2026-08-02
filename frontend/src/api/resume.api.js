import api from "./axios";

export const getResumes = async () => {
    const response = await api.get("/resume");
    return response.data;
};

export const uploadResume = async ({ file, onUploadProgress }) => {
    const formData = new FormData();
    formData.append("resume", file);

    const response = await api.post("/resume/upload", formData, { onUploadProgress });

    return response.data;
};

export const deleteResume = async (resumeId) => {
    const response = await api.delete(`/resume/${resumeId}`);
    return response.data;
};
