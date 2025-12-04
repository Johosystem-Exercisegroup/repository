import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Paper } from '@mui/material';
import { useRegisterLecture } from '../hooks/useRegisterLecture';
import { useSetup } from '../hooks/useSetup';

export const RegisterLecture = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { defCalendarInfo } = useSetup();
  const { registerLecture, unregisterLecture, isLectureRegistered } =
    useRegisterLecture(defCalendarInfo);

  const lecture = location.state?.lecture;
  const registered = isLectureRegistered(lecture?.id);

  const handleRegister = async () => {
    try {
      const isFailure = await registerLecture(lecture.id);
      if (isFailure) {
        alert("この時限は他の講義が登録されています。");
      } else {
        alert(`「${lecture.科目}」を登録しました。`);
        navigate(-1); // 戻る
      }
    } catch (error) {
      console.error('登録失敗:', error);
      alert('登録に失敗しました。');
    }
  };

  const handleUnregister = async () => {
    try {
      await unregisterLecture(lecture.id);
      alert(`「${lecture.科目}」を解除しました。`);
      navigate(-1);
    } catch (error) {
      console.error('解除失敗:', error);
      alert('解除に失敗しました。');
    }
  };

  if (!lecture) {
    return <Typography>講義情報が見つかりません。</Typography>;
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Paper sx={{ padding: 2, marginBottom: 2 }}>
        <Typography variant="h5">{lecture.科目}</Typography>
        {lecture.touroku_no && (
          <Typography variant="body1">
            <strong>登録番号:</strong> {lecture.touroku_no}
          </Typography>
        )}
        <Typography variant="body1">
          <strong>時限:</strong> {lecture.時限}
        </Typography>
        <Typography variant="body1">
          <strong>学部:</strong> {lecture.開講}
        </Typography>
        <Typography variant="body1">
          <strong>教員:</strong> {lecture.教員}
        </Typography>
        <Typography variant="body1">
          <strong>学年:</strong> {lecture.学年}
        </Typography>
        <Typography variant="body1">
          <strong>単位:</strong> {lecture.単位}
        </Typography>
        {lecture.subject_category && (
          <Typography variant="body1">
            <strong>授業区分:</strong> {lecture.subject_category}
          </Typography>
        )}
        <Typography variant="body1">
          <a href={lecture.url} target="_blank" rel="noopener noreferrer" >
            詳細を見る
          </a>
        </Typography>
      </Paper>
      {registered ? (
        <Button variant="outlined" color="error" onClick={handleUnregister}>
          登録解除
        </Button>
      ) : (
        <Button variant="contained" color="primary" onClick={handleRegister}>
          登録
        </Button>
      )}
      <Button variant="text" onClick={() => navigate(-1)} sx={{ marginLeft: 2 }}>
        キャンセル
      </Button>
    </Box>
  );
};
