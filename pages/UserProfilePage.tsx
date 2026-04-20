import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import Input from '../components/Input';
import Button from '../components/Button';
import DeleteAccountConfirmDialog from '../components/DeleteAccountConfirmDialog';
import Spinner from '../components/Spinner';
import { validatePassword, getPasswordErrorFrom422 } from '../utils/passwordValidation';
import type { Company, CompanyUpdate, CompanyStage } from '../types';

type TabId = 'general' | 'security';

const UserProfilePage: React.FC = () => {
  const { user, logout, setCompanyData } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [profile, setProfile] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<CompanyUpdate>({});
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPasswordTouched, setNewPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isCompany = user?.role === 'COMPANY';

  const loadProfile = useCallback(async () => {
    if (!isCompany || !user?.company?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      try {
        const company = await api.getCompanyMe();
        setProfile(company);
      } catch {
        const company = await api.getMyCompany(user.company.id);
        setProfile(company);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      if (user?.company) setProfile(user.company);
    } finally {
      setLoading(false);
    }
  }, [isCompany, user?.company?.id, user?.company]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name ?? '',
        email: profile.email ?? '',
        phone_number: profile.phone_number ?? '',
        professional_profile_link: profile.professional_profile_link ?? '',
        company_name: profile.company_name ?? '',
        stage: profile.stage ?? null,
        description: profile.description ?? '',
      });
    }
  }, [profile]);

  const handleEditChange = (field: keyof CompanyUpdate, value: string | null) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const payload: CompanyUpdate = {
        full_name: editForm.full_name ?? null,
        phone_number: editForm.phone_number || null,
        professional_profile_link: editForm.professional_profile_link || null,
        company_name: editForm.company_name ?? null,
        stage: (editForm.stage as CompanyStage) || null,
        description: editForm.description || null,
      };
      const updated = await api.updateCompanyMe(payload);
      setProfile(updated);
      setCompanyData(updated);
      setIsEditing(false);
      showToast({ message: t('profile.general.saved'), type: 'success', duration: 3000 });
    } catch (err) {
      console.error('Failed to update profile:', err);
      showToast({ message: t('profile.general.saveError'), type: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const newPasswordValidation = validatePassword(newPassword, t);
  const newPasswordError = newPasswordTouched ? (newPasswordValidation.valid ? undefined : newPasswordValidation.message) : undefined;
  const confirmError = confirmPasswordTouched
    ? (confirmPassword !== newPassword ? t('profile.security.passwordMismatch') : undefined)
    : undefined;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordValidation.valid || newPassword !== confirmPassword) return;
    setChangingPassword(true);
    try {
      await api.updateCompanyPassword({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNewPasswordTouched(false);
      setConfirmPasswordTouched(false);
      showToast({ message: t('profile.security.passwordChanged'), type: 'success', duration: 3000 });
    } catch (err: unknown) {
      const msg = getPasswordErrorFrom422((err as { response?: { data?: unknown } })?.response?.data) ?? t('profile.security.passwordChangeError');
      showToast({ message: msg, type: 'error', duration: 4000 });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.deleteCompanyMe();
      logout();
      navigate('/', { replace: true });
      showToast({ message: t('profile.security.accountDeleted'), type: 'success', duration: 3000 });
    } catch (err) {
      console.error('Failed to delete account:', err);
      showToast({ message: t('profile.security.deleteError'), type: 'error', duration: 3000 });
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (!user) return null;

  if (!isCompany) {
    return (
      <div className="profile-page p-4 md:p-8">
        <div className="rounded-lg border border-border bg-card p-6">
          <h1 className="mb-2 text-2xl font-bold text-foreground">{t('profile.title')}</h1>
          <p className="text-secondary-alpha">{t('profile.notAvailable')}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-page flex justify-center items-center min-h-[200px]">
        <Spinner size="large" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page p-4 md:p-8">
        <p className="text-destructive">{t('profile.loadError')}</p>
      </div>
    );
  }

  return (
    <div className="profile-page p-4 md:p-8">
      <div className="profile-page__header mb-6 border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">{t('profile.title')}</h1>
        </div>
      </div>

      <div className="mb-6 flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`profile-page__tab -mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'general'
              ? 'border-primary text-primary-text'
              : 'border-transparent text-secondary-alpha hover:text-foreground'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {t('profile.tabs.general')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`profile-page__tab -mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'security'
              ? 'border-primary text-primary-text'
              : 'border-transparent text-secondary-alpha hover:text-foreground'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          {t('profile.tabs.security')}
        </button>
      </div>

      {activeTab === 'general' && (
        <div className="profile-page__general rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">{t('profile.general.title')}</h2>
            {!isEditing ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                {t('profile.general.edit')}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsEditing(false)} disabled={saving}>
                  {t('common.cancel')}
                </Button>
                <Button type="button" variant="primary" size="sm" onClick={handleSaveProfile} isLoading={saving}>
                  {t('common.save')}
                </Button>
              </div>
            )}
          </div>
          <div className="space-y-4 max-w-3xl">
            {isEditing ? (
              <>
                <Input
                  id="profile-full_name"
                  label={t('auth.fullName')}
                  value={editForm.full_name ?? ''}
                  onChange={(e) => handleEditChange('full_name', e.target.value)}
                />
                <Input
                  id="profile-email"
                  label={t('auth.email')}
                  type="email"
                  value={editForm.email ?? ''}
                  disabled
                  className="bg-background/80"
                />
                <Input
                  id="profile-phone_number"
                  label={t('auth.phoneNumber')}
                  value={editForm.phone_number ?? ''}
                  onChange={(e) => handleEditChange('phone_number', e.target.value)}
                />
                <Input
                  id="profile-company_name"
                  label={t('auth.companyName')}
                  value={editForm.company_name ?? ''}
                  onChange={(e) => handleEditChange('company_name', e.target.value)}
                />
                <Input
                  id="profile-description"
                  label={t('common.description')}
                  multiline
                  rows={3}
                  value={editForm.description ?? ''}
                  onChange={(e) => handleEditChange('description', e.target.value)}
                />
              </>
            ) : (
              <div className="divide-y divide-border">
                <div className="flex items-center justify-between gap-4 py-3 first:pt-0">
                  <span className="shrink-0 text-sm font-medium text-secondary-alpha">{t('auth.fullName')}</span>
                  <p className="break-words text-right text-sm text-foreground">{profile.full_name || '—'}</p>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <span className="shrink-0 text-sm font-medium text-secondary-alpha">{t('auth.email')}</span>
                  <p className="break-words text-right text-sm text-foreground">{profile.email || '—'}</p>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <span className="shrink-0 text-sm font-medium text-secondary-alpha">{t('auth.phoneNumber')}</span>
                  <p className="break-words text-right text-sm text-foreground">{profile.phone_number || '—'}</p>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <span className="shrink-0 text-sm font-medium text-secondary-alpha">{t('auth.companyName')}</span>
                  <p className="break-words text-right text-sm text-foreground">{profile.company_name || '—'}</p>
                </div>
                <div className="flex items-start justify-between gap-4 py-3 last:pb-0">
                  <span className="shrink-0 text-sm font-medium text-secondary-alpha">{t('common.description')}</span>
                  <p className="break-words whitespace-pre-wrap text-right text-sm text-foreground">{profile.description || '—'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="profile-page__security max-w-xl space-y-6">
          <div className="profile-page__block rounded-lg border border-border bg-card p-6">
            <h3 className="mb-4 text-base font-semibold text-foreground">{t('profile.security.changePassword')}</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                id="current-password"
                label={t('profile.security.currentPassword')}
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Input
                id="new-password"
                label={t('profile.security.newPassword')}
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onBlur={() => setNewPasswordTouched(true)}
                error={newPasswordError}
              />
              <Input
                id="confirm-password"
                label={t('profile.security.confirmPassword')}
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setConfirmPasswordTouched(true)}
                error={confirmError}
              />
              <Button type="submit" variant="primary" isLoading={changingPassword} disabled={!currentPassword || !newPasswordValidation.valid || newPassword !== confirmPassword}>
                {t('profile.security.changePasswordButton')}
              </Button>
            </form>
          </div>

          <div className="profile-page__block profile-page__block--danger max-w-xl rounded-lg border-2 border-destructive/40 bg-destructive/5 p-6">
            <h3 className="mb-2 text-base font-semibold text-foreground">{t('profile.security.deleteAccount')}</h3>
            <p className="mb-4 text-sm text-secondary-alpha">{t('profile.security.deleteWarning')}</p>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center gap-2 !bg-red-600 hover:!bg-red-700 focus:ring-red-500 text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t('profile.security.deleteAccountButton')}
            </Button>
          </div>
        </div>
      )}

      <DeleteAccountConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title={t('profile.security.deleteModalTitle')}
        message={t('profile.security.deleteModalMessage')}
        confirmWord="delete"
        confirmWordLabel={t('profile.security.deleteModalConfirmLabel')}
        confirmButtonLabel={t('profile.security.deleteModalConfirmButton')}
        cancelLabel={t('common.cancel')}
      />
    </div>
  );
};

export { UserProfilePage };
