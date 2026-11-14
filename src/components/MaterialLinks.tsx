'use client';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { useState } from 'react';
import { errorMessage } from '@/api/errors';
import { getMaterial } from '@/api/weeks';
import { useToast } from '@/contexts/ToastContext';
import type { MaterialLink } from '@/types/api';

export default function MaterialLinks({ materials, onDelete, busy = false }: {
  materials: MaterialLink[];
  onDelete?: (material: MaterialLink) => Promise<void>;
  busy?: boolean;
}) {
  const toast = useToast();
  const [detail, setDetail] = useState<MaterialLink | null>(null);
  const [loading, setLoading] = useState(false);

  const openDetail = async (id: number) => {
    setLoading(true);
    try {
      setDetail(await getMaterial(id));
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {materials.map((material) => (
        <Box key={material.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Button size="small" disabled={busy || loading} onClick={() => void openDetail(material.id)} sx={{ textAlign: 'left' }}>
            {material.title}
          </Button>
          {onDelete && (
            <IconButton size="small" disabled={busy} aria-label={`${material.title} 삭제`} onClick={() => void onDelete(material)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      ))}
      <Dialog open={detail !== null} onClose={() => setDetail(null)} fullWidth maxWidth="xs">
        <DialogTitle>{detail?.title}</DialogTitle>
        <DialogContent sx={{ overflowWrap: 'anywhere' }}>
          {detail?.url && /^https?:\/\//i.test(detail.url)
            ? <a href={detail.url} target="_blank" rel="noreferrer">{detail.url}</a>
            : '등록된 링크가 없어요.'}
        </DialogContent>
        <DialogActions><Button onClick={() => setDetail(null)}>닫기</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
