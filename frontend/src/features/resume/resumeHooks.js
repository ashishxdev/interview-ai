import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteResume, getResumes, uploadResume } from "../../api/resume.api";

export const useResumes = () => {
    return useQuery({
        queryKey: ["resumes"],
        queryFn: getResumes,
    });
};

export const useUploadResume = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: uploadResume,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resumes"] });
            toast.success("Resume uploaded successfully.");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Resume upload failed.");
        },
    });
};

export const useDeleteResume = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteResume,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resumes"] });
            toast.success("Resume deleted.");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Could not delete resume.");
        },
    });
};
