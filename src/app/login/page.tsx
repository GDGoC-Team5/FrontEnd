'use client';

import { Box, Button, TextField, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { login } from '@/api/auth';
import { errorMessage } from '@/api/errors';
import AuthShell from '@/components/AuthShell';
import { Field } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { USE_MOCK } from '@/lib/config';
import { resetDb } from '@/mocks/db';
import { colors } from '@/theme/theme';

/** 로그인한 뒤 돌아갈 주소 (?next=/studies/1/dashboard). 다른 사이트 주소는 무시해요. */
function nextPath() {
  if (typeof window === 'undefined') return '/home';
  const next = new URLSearchParams(window.location.search).get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/home';
}

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, refresh } = useAuth();
  const [email, setEmail] = useState(USE_MOCK ? 'demo@gdgoc.com' : '');
  const [password, setPassword] = useState(USE_MOCK ? 'demo1234!' : '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 이미 로그인돼 있으면 바로 홈으로
  useEffect(() => {
    if (user) router.replace(nextPath());
  }, [user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      await refresh();
      router.replace(nextPath());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <Typography component="h1" sx={{ fontSize: 44, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
        로그인
      </Typography>
      <Typography sx={{ color: colors.textSub, fontSize: 18, fontWeight: 600, mt: 1, mb: 4.5 }}>가입한 이메일로 로그인 하세요.</Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Field label="이메일">
          <TextField fullWidth type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="비밀번호">
          <TextField
            fullWidth
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {error && (
          <Box sx={{ bgcolor: colors.missBg, color: colors.missText, borderRadius: '9px', px: 2.5, py: 1.25, fontSize: 15 }} role="alert">
            {error}
          </Box>
        )}

        <Button type="submit" size="large" variant="contained" color="secondary" disabled={submitting} sx={{ mt: 1, fontSize: 22 }}>
          {submitting ? '로그인 중…' : '로그인'}
        </Button>
      </Box>

      <Typography sx={{ textAlign: 'center', mt: 2.5, color: colors.textSub, fontSize: 18, fontWeight: 600 }}>
        아직 계정이 없나요?{' '}
        <Link href="/signup" style={{ color: colors.primary }}>
          회원가입
        </Link>
      </Typography>

      {USE_MOCK && (
        <Box sx={{ mt: 4, p: 2, borderRadius: '9px', bgcolor: colors.bg, fontSize: 13, color: colors.textMuted }}>
          지금은 <b>가짜 데이터 모드</b>예요. 데모 계정 demo@gdgoc.com / demo1234! 로 로그인돼요.{' '}
          <Box
            component="button"
            type="button"
            onClick={() => {
              resetDb();
              toast('가짜 데이터를 처음 상태로 되돌렸어요.', 'info');
            }}
            sx={{ border: 0, background: 'none', p: 0, color: colors.primary, textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}
          >
            가짜 데이터 초기화
          </Box>
        </Box>
      )}
    </AuthShell>
  );
}
