import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { DesignerInvite } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { validatePassword, getPasswordErrorFrom422 } from '../utils/passwordValidation';

const DesignerInvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const { loginFromInviteToken } = useAuth();
  const [invite, setInvite] = useState<DesignerInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(t('designerInvite.invalid'));
      setLoading(false);
      return;
    }
    const run = async () => {
      try {
        const data = await api.getDesignerInvite(token);
        if (data.status !== 'pending') {
          setError(t('designerInvite.notPending'));
          setInvite(null);
        } else {
          setInvite(data);
        }
      } catch {
        setError(t('designerInvite.loadError'));
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [token, t]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const v = validatePassword(password, t);
    if (!v.valid) {
      setError(v.message ?? t('designerInvite.acceptError'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const tok = await api.acceptDesignerInvite(token, { token, name, password });
      await loginFromInviteToken(tok);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: unknown } };
      const passwordMsg =
        e?.response?.status === 422 && e.response.data
          ? getPasswordErrorFrom422(e.response.data as never)
          : null;
      setError(passwordMsg ?? t('designerInvite.acceptError'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <Link to="/" className="text-sm text-secondary-alpha hover:text-foreground">
            {t('common.back')}
          </Link>
        </div>
        <Card className="border border-border p-8">
          <h1 className="mb-2 text-xl font-bold">{t('designerInvite.title')}</h1>
          {invite && (
            <p className="mb-6 text-sm text-secondary-alpha">
              {t('designerInvite.forEmail')}: <span className="font-medium text-foreground">{invite.designer_email}</span>
            </p>
          )}
          {error && !invite && <p className="text-sm text-red-600">{error}</p>}
          {invite && (
            <form className="space-y-4" onSubmit={handleAccept}>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Input id="inv-name" label={t('common.name')} value={name} onChange={(e) => setName(e.target.value)} required />
              <Input
                id="inv-password"
                type="password"
                label={t('common.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordTouched(true)}
                required
                error={
                  passwordTouched
                    ? (() => {
                        const pv = validatePassword(password, t);
                        return pv.valid ? undefined : pv.message;
                      })()
                    : undefined
                }
              />
              <Button type="submit" className="w-full" isLoading={busy}>
                {t('designerInvite.accept')}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DesignerInvitePage;
