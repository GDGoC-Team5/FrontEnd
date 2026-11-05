'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import { useRef, useState, type DragEvent } from 'react';
import { colors } from '@/theme/theme';

/** 파일을 끌어다 놓거나 눌러서 고르는 상자 (피그마 "txt.md.pdf 파일을 끌어다 놓기") */
export default function FileDropzone({
  onFiles,
  accept = '.pdf,.md,.txt',
  hint = 'txt · md · pdf 파일을 끌어다 놓거나 눌러서 고르세요',
  busy = false,
  compact = false,
}: {
  onFiles: (files: File[]) => void;
  accept?: string;
  hint?: string;
  busy?: boolean;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  };

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      sx={{
        minHeight: compact ? 56 : 80,
        px: 2,
        py: compact ? 1 : 2.5,
        border: `1px dashed ${over ? colors.primary : colors.border}`,
        borderRadius: compact ? '6px' : '13px',
        bgcolor: over ? colors.primarySoft : colors.white,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'background-color .15s',
      }}
    >
      {busy ? (
        <CircularProgress size={22} />
      ) : (
        <Typography sx={{ color: colors.textSub, fontSize: compact ? 12 : 15, whiteSpace: 'pre-line' }}>{hint}</Typography>
      )}
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple
        accept={accept}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = '';
        }}
      />
    </Box>
  );
}
