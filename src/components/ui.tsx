'use client';

/** 여러 화면에서 같이 쓰는 작은 조각들 */
import { Box, Button, CircularProgress, Typography, type SxProps, type Theme } from '@mui/material';
import type { ReactNode } from 'react';
import { errorMessage } from '@/api/errors';
import { colors } from '@/theme/theme';

/** 흰 카드 (피그마의 둥근 테두리 박스) */
export function Panel({
  title,
  action,
  children,
  sx,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      sx={[
        { bgcolor: colors.white, border: `1px solid ${colors.border}`, borderRadius: '17px', p: { xs: 2.5, md: 3 } },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {(title || action) && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
          {title && (
            <Typography component="h2" sx={{ fontSize: 22, fontWeight: 700 }}>
              {title}
            </Typography>
          )}
          {action}
        </Box>
      )}
      {children}
    </Box>
  );
}

/** 화면 맨 위 큰 제목 + 오른쪽 버튼들 */
export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 3.5 }}>
      <Box>
        <Typography component="h1" sx={{ fontSize: { xs: 30, md: 40 }, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
          {title}
        </Typography>
        {subtitle && <Typography sx={{ color: colors.textSub, fontSize: 17, fontWeight: 600, mt: 0.5 }}>{subtitle}</Typography>}
      </Box>
      {actions && <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>{actions}</Box>}
    </Box>
  );
}

export function LoadingBox({ minHeight = 240 }: { minHeight?: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight }}>
      <CircularProgress size={32} />
    </Box>
  );
}

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <Typography sx={{ fontWeight: 600, mb: 1 }}>불러오지 못했어요</Typography>
      <Typography sx={{ color: colors.textMuted, mb: 2 }}>{errorMessage(error)}</Typography>
      {onRetry && (
        <Button variant="outlined" onClick={onRetry}>
          다시 시도
        </Button>
      )}
    </Box>
  );
}

export function EmptyBox({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <Box sx={{ textAlign: 'center', py: 5, color: colors.textSub }}>
      <Typography sx={{ fontWeight: 600, color: 'inherit' }}>{children}</Typography>
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
}

/** 403 화면 */
export function Forbidden({ message = '이 화면을 볼 권한이 없어요.', action }: { message?: string; action?: ReactNode }) {
  return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <Typography sx={{ fontSize: 48, fontWeight: 800, color: colors.primary }}>403</Typography>
      <Typography sx={{ fontWeight: 700, fontSize: 20, mt: 1 }}>{message}</Typography>
      {action && <Box sx={{ mt: 3 }}>{action}</Box>}
    </Box>
  );
}

/** 라벨 + 입력칸 묶음 */
export function Field({ label, children, sx }: { label: ReactNode; children: ReactNode; sx?: SxProps<Theme> }) {
  return (
    <Box sx={sx}>
      <Typography component="label" sx={{ display: 'block', fontSize: 17, fontWeight: 600, mb: 1 }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}
