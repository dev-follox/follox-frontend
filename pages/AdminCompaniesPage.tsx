import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Company } from '../types';
import Card from '../components/Card';
import Spinner from '../components/Spinner';

const AdminCompaniesPage: React.FC = () => {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
    loadCompanies();
  }, [user, navigate]);

  const loadCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAllCompanies();
      setCompanies(data);
    } catch (err: any) {
      setError(t('admin.companies.loadError'));
      console.error('Failed to load companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString(language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="admin-companies-page">
        <div className="flex justify-center items-center h-64">
          <Spinner size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-companies-page">
      <div className="admin-companies-header">
        <h1 className="admin-companies-header__title">{t('admin.companies.title')}</h1>
      </div>

      {error && (
        <div className="qa-alert qa-alert--error">
          {error}
        </div>
      )}

      {companies.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          <p>{t('admin.companies.noCompanies')}</p>
        </Card>
      ) : (
        <div className="admin-companies-table">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                  {t('admin.companies.table.companyName')}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                  {t('admin.companies.table.email')}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                  {t('admin.companies.table.fullName')}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                  {t('admin.companies.table.created')}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                  {t('admin.companies.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr
                  key={company.id}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/admin/companies/${company.id}`)}
                >
                  <td className="py-3 px-4 text-sm text-gray-900">{company.company_name}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{company.email}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{company.full_name}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{formatDate(company.created_at)}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/companies/${company.id}`);
                      }}
                      className="text-primary-text text-sm font-medium"
                    >
                      {t('admin.companies.table.view')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCompaniesPage;
