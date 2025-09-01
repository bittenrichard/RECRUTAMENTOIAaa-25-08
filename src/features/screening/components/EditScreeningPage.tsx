import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDataStore } from '../../../shared/store/useDataStore';
import JobForm from './JobForm';
import { JobPosting, JobFormData } from '../types';

const EditScreeningPage: React.FC = () => {
    const navigate = useNavigate();
    const { jobId } = useParams<{ jobId: string }>();
    const { jobs, updateJob } = useDataStore();

    const jobToEdit = jobs.find(job => job.id === Number(jobId));

    const handleJobUpdated = async (updatedData: JobFormData) => {
        if (!jobToEdit) return;
        try {
            await updateJob(jobToEdit.id, updatedData);
            navigate('/dashboard');
        } catch (error) {
            console.error("Erro ao atualizar vaga:", error);
            alert("Não foi possível atualizar a vaga.");
        }
    };
    
    if (!jobToEdit) {
        return <div>Vaga não encontrada ou não pertence a você.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Editar Vaga</h1>
            <JobForm
                onFormSubmit={handleJobUpdated}
                onCancel={() => navigate('/dashboard')}
                initialData={jobToEdit as JobPosting}
            />
        </div>
    );
};

export default EditScreeningPage;