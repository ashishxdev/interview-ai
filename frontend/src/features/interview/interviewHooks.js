import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
    createInterview,
    deleteInterview,
    getInterviewHistory,
    getInterviewQuestions,
    getInterviewReport,
    submitInterviewAnswer,
} from "../../api/interview.api";

export const useCreateInterview = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createInterview,
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ["interviews"] });
            toast.success("Interview created.");
            navigate(`/interviews/${response.interviewId}`);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Could not create interview.");
        },
    });
};

export const useInterviewQuestions = (interviewId) => {
    return useQuery({
        queryKey: ["interview", interviewId, "questions"],
        queryFn: () => getInterviewQuestions(interviewId),
        enabled: Boolean(interviewId),
    });
};

export const useSubmitInterviewAnswer = (interviewId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: submitInterviewAnswer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["interview", interviewId, "questions"] });
            queryClient.invalidateQueries({ queryKey: ["interviews"] });
            toast.success("Answer submitted.");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Could not submit answer.");
        },
    });
};

export const useInterviewReport = (interviewId) => {
    return useQuery({
        queryKey: ["interview", interviewId, "report"],
        queryFn: () => getInterviewReport(interviewId),
        enabled: Boolean(interviewId),
        retry: false,
    });
};

export const useInterviewHistory = () => {
    return useQuery({
        queryKey: ["interviews"],
        queryFn: getInterviewHistory,
    });
};

export const useDeleteInterview = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteInterview,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["interviews"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            toast.success("Interview deleted.");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Could not delete interview.");
        },
    });
};
