import AssessmentPage from "@/pages/Assessment/single-assessment-page.tsx";
import {assessmentService} from "@/services/assessment-service.ts";
import type {AssessmentI} from "@/models/assesment-model.ts";
import {useEffect, useState} from "react";
import {useParams} from "react-router-dom";

export default function AssessmentDetailsPage() {
    const { cognitoSub, assessmentId } = useParams();

    const [assessment, setAssessment] = useState<AssessmentI | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!assessmentId || !cognitoSub) return;

        const loadAssessment = async () => {
            try {
                const response = await assessmentService.getById(
                    cognitoSub,
                    assessmentId
                );

                setAssessment(response);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        loadAssessment();
    }, [assessmentId, cognitoSub]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!assessment) {
        return <div>Assessment not found</div>;
    }

    return   (
        <div className="max-w-5xl mx-auto px-4 pt-8 md:pt-16 space-y-8 min-h-screen pb-20 animate-fadeIn">
            <AssessmentPage data={assessment} />
        </div>
    );
}