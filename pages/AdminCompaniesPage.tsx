import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Company } from '../types';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import {
  dataTableWrap,
  dataTable,
  dataTheadRow,
  dataTh,
  dataTbodyRow,
  dataTd,
} from '../components/dataTableStyles';

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
        <Card className="p-8 text-center text-secondary-alpha">
          <p>{t('admin.companies.noCompanies')}</p>
        </Card>
      ) : (
        <div className={dataTableWrap}>
          <table className={dataTable}>
            <thead>
              <tr className={dataTheadRow}>
                <th className={dataTh}>{t('admin.companies.table.companyName')}</th>
                <th className={dataTh}>{t('admin.companies.table.email')}</th>
                <th className={dataTh}>{t('admin.companies.table.fullName')}</th>
                <th className={dataTh}>{t('admin.companies.table.created')}</th>
                <th className={dataTh}>{t('admin.companies.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr
                  key={company.id}
                  className={`${dataTbodyRow} cursor-pointer`}
                  onClick={() => navigate(`/admin/companies/${company.id}`)}
                >
                  <td className={`${dataTd} text-foreground`}>{company.company_name}</td>
                  <td className={dataTd}>{company.email}</td>
                  <td className={dataTd}>{company.full_name}</td>
                  <td className={`${dataTd} text-secondary-alpha`}>{formatDate(company.created_at)}</td>
                  <td className={dataTd}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/companies/${company.id}`);
                      }}
                      className="text-sm font-medium text-primary hover:underline"
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
