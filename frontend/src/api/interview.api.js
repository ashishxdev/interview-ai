import api from "./axios";

export const createInterview = async (data) => {
    const response = await api.post("/interview/create", data);
    return response.data;
};

export const getInterviewQuestions = async (interviewId) => {
    const response = await api.get(`/interview/${interviewId}/questions`);
    return response.data;
};

export const submitInterviewAnswer = async ({ interviewId, questionId, answer, timeTaken, transcript, tabSwitchCount, fullscreenExits }) => {
    const response = await api.post(`/interview/${interviewId}/answer`, {
        questionId,
        answer,
        timeTaken,
        transcript,
        tabSwitchCount,
        fullscreenExits,
    });
    return response.data;
};

export const getInterviewReport = async (interviewId) => {
    const response = await api.get(`/interview/${interviewId}/report`);
    return response.data;
};

export const getInterviewHistory = async () => {
    const response = await api.get("/interview");
    return response.data;
};

export const deleteInterview = async (interviewId) => {
    const response = await api.delete(`/interview/${interviewId}`);
    return response.data;
};
