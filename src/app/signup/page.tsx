'use client';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { Box, Button, TextField, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { signup } from '@/api/auth';
import { errorMessage, isApiError } from '@/api/errors';
import AuthShell from '@/components/AuthShell';
import { Field } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { colors } from '@/theme/theme';

/**
 * 회원가입 — 현우 피드백 반영:
 * 이메일 인증 단계 없이 한 화면(이메일 / 닉네임 / 비밀번호 / 비밀번호 확인 / 가입하기),
 * 닉네임 2~10자, 비밀번호 8~64자 + 영문·숫자·특수문자 각 1개 이상,
 * 비밀번호 확인은 화면에서만 비교, 가입 후 자동 로그인 없이 로그인 화면으로 + 토스트.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function passwordRules(pw: string) {
  return {
    letter: /[A-Za-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9\s]/.test(pw),
    length: pw.length >= 8 && pw.length <= 64,
  };
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: ok ? colors.doneText : colors.textSub, fontSize: 16 }}>
      {ok ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : <RadioButtonUncheckedIcon sx={{ fontSize: 16 }} />}
      {label}
    </Box>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState({ email: false, nickname: false, password: false, confirm: false });
  const [serverEmailError, setServerEmailError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const rules = passwordRules(password);
  const passwordOk = rules.letter && rules.number && rules.special && rules.length;
  const nick = nickname.trim();

  const errors = {
    email: !email.trim() ? '이메일을 입력해 주세요.' : !EMAIL_RE.test(email.trim()) ? '이메일 형식이 올바르지 않습니다.' : null,
    nickname: nick.length < 2 || nick.length > 10 ? '닉네임은 2~10자로 입력해 주세요.' : null,
    password: passwordOk ? null : '8~64자, 영문·숫자·특수문자를 각 1개 이상 넣어 주세요.',
    confirm: confirm !== password || !confirm ? '비밀번호가 일치하지 않습니다.' : null,
  };
  const valid = !errors.email && !errors.nickname && !errors.password && !errors.confirm;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, nickname: true, password: true, confirm: true });
    if (!valid) return;
    setSubmitting(true);
    setServerError(null);
    setServerEmailError(null);
    try {
      await signup({ email: email.trim(), nickname: nick, password });
      toast('회원가입이 완료되었습니다. 로그인해주세요.');
      router.push('/login');
    } catch (err) {
      if (isApiError(err, 409)) setServerEmailError('이미 가입된 이메일입니다.');
      else setServerError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const helper = (key: keyof typeof errors) => (touched[key] && errors[key] ? errors[key] : ' ');

  return (
    <AuthShell>
      <Typography component="h1" sx={{ fontSize: 34, fontWeight: 600, letterSpacing: '-0.03em' }}>
        회원가입
      </Typography>
      <Typography sx={{ color: colors.textSub, fontSize: 16, fontWeight: 600, mt: 0.5, mb: 3 }}>이메일과 비밀번호로 가입해요.</Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Field label="이메일">
          <TextField
            fullWidth
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setServerEmailError(null);
            }}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            error={!!serverEmailError || (touched.email && !!errors.email)}
            helperText={serverEmailError ? ' ' : helper('email')}
          />
          {serverEmailError && (
            <Box role="alert" sx={{ mt: -1.5, mb: 1, bgcolor: colors.missBg, color: colors.missText, borderRadius: '9px', px: 2.5, py: 1.25, fontSize: 15 }}>
              {serverEmailError}
            </Box>
          )}
        </Field>

        <Field label="닉네임">
          <TextField
            fullWidth
            placeholder="2~10자"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, nickname: true }))}
            error={touched.nickname && !!errors.nickname}
            helperText={helper('nickname')}
          />
        </Field>

        <Field label="비밀번호">
          <TextField
            fullWidth
            type="password"
            autoComplete="new-password"
            placeholder="8~64자, 영문·숫자·특수문자 각 1개 이상"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            error={touched.password && !!errors.password}
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 0.75, px: 1, mt: 1.25, mb: 1.5 }}>
            <Rule ok={rules.letter} label="영문" />
            <Rule ok={rules.number} label="숫자" />
            <Rule ok={rules.special} label="특수문자" />
            <Rule ok={rules.length} label="8~64자" />
          </Box>
        </Field>

        <Field label="비밀번호 확인">
          <TextField
            fullWidth
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
            error={touched.confirm && !!errors.confirm}
            helperText={helper('confirm')}
          />
        </Field>

        {serverError && (
          <Box role="alert" sx={{ bgcolor: colors.missBg, color: colors.missText, borderRadius: '9px', px: 2.5, py: 1.25, fontSize: 15 }}>
            {serverError}
          </Box>
        )}

        <Button
          type="submit"
          size="large"
          variant="contained"
          color="secondary"
          disabled={submitting}
          sx={{ mt: 1, fontSize: 18, ...(valid ? {} : { bgcolor: '#7d7a90', '&:hover': { bgcolor: '#6e6b82' } }) }}
        >
          {submitting ? '가입 중…' : '가입하기'}
        </Button>
      </Box>

      <Typography sx={{ textAlign: 'center', mt: 2, color: colors.textSub, fontSize: 16, fontWeight: 600 }}>
        이미 계정이 있나요?{' '}
        <Link href="/login" style={{ color: colors.primary }}>
          로그인
        </Link>
      </Typography>
    </AuthShell>
  );
}
