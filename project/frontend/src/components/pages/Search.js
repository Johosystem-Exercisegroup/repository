import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Button, Link, FormControlLabel, Checkbox } from '@mui/material';
import { Header } from '../templates/Header';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSetup } from '../hooks/useSetup';
const apiUrl = process.env.REACT_APP_API_URL;

export const Search = () => {
  const DEPARTMENTS = [
    "青山スタンダード科目", "文学部共通", "文学部外国語科目", "英米文学科", "フランス文学科",
    "比較芸術学科", "教育人間　外国語科目", "教育人間　教育学科", "教育人間　心理学科", "経済学部",
    "法学部", "経営学部", "教職課程科目", "国際政治経済学部", "総合文化政策学部", "日本文学科",
    "史学科", "理工学部共通", "物理科学", "数理サイエンス", "物理・数理", "電気電子工学科",
    "機械創造", "経営システム", "情報テクノロジ－", "社会情報学部", "地球社会共生学部", "コミュニティ人間科学部",
    "化学・生命"
  ];

  const SEMESTERS = [
    "指定なし","前期", "通年", "後期"
  ];

  const CAMUPUSES = [ "青山", "相模原" ]

  const DAYS = ["月", "火", "水", "木", "金", "土", "不定"];
  const PERIODS = ["１", "２", "３", "４", "５", "６"];
  

  const DELIVERY_MODES = ["対面", "オンライン"];

  const GRADES = ["１", "２", "３", "４"];

  const navigate = useNavigate();
  const location = useLocation();
  const { defCalendarInfo } = useSetup(); // defCalendarInfoを取得

  const [searchCriteria, setSearchCriteria] = useState({
    days: [],
    periods: [],
    departments: [],
    semesters: [],
    courseName: '',
    instructorName: '',
    campuses: [],
    subjectCategories: [],
    
    deliveryModes: [],
    gradeYears: [],
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subjectCategories, setSubjectCategories] = useState([]);

  // 授業区分リストの取得
  useEffect(() => {
    const fetchSubjectCategories = async () => {
      try {
        const response = await axios.get(`${apiUrl}/subject-categories`);
        setSubjectCategories(response.data.subject_categories || []);
      } catch (error) {
        console.error("授業区分の取得に失敗:", error);
      }
    };
    fetchSubjectCategories();
  }, []);

  // 初期条件の設定
  useEffect(() => {
    console.log("location.state:", location.state); // ログを追加

    if (defCalendarInfo || location.state) {
      const formattedPeriods = location.state?.periods.map((period) =>
        period.replace(/\d/, (d) => String.fromCharCode(d.charCodeAt(0) + 0xfee0))
      );

      console.log("formattedPeriods:", formattedPeriods); // フォーマット後のperiodsをログに出力

        setSearchCriteria((prev) => ({
            ...prev,
            days: location.state?.days || [],
            periods: formattedPeriods || [],
            departments: defCalendarInfo?.department || [],
            semesters: defCalendarInfo?.semester || [],
            campuses: defCalendarInfo?.campus || [],
        }));
    }
  }, [defCalendarInfo, location.state]);

      const handleCheckboxChange = (field, value) => {
        setSearchCriteria((prev) => {
            const currentValues = prev[field] || [];
            const updatedValues = currentValues.includes(value)
                ? currentValues.filter((v) => v !== value)
                : [...currentValues, value];
            return { ...prev, [field]: updatedValues };
        });
    };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchCriteria({ ...searchCriteria, [name]: value });
  };

  const handleSearch = async () => {
    if (!defCalendarInfo) {
      setError('デフォルトカレンダーの情報を取得できませんでした。');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let combinedDayPeriod = [];
      if (searchCriteria.days.length > 0 && searchCriteria.periods.length > 0) {
        combinedDayPeriod = searchCriteria.days.flatMap((day) =>
          searchCriteria.periods.map((period) => `${day}${period}`)
        );
      } else if (searchCriteria.days.length > 0) {
        combinedDayPeriod = [...searchCriteria.days];
      } else if (searchCriteria.periods.length > 0) {
        combinedDayPeriod = [...searchCriteria.periods];
      }

      console.log("リクエスト送信:", {
        ...searchCriteria,
        dayPeriodCombinations: combinedDayPeriod,
      });

      const response = await axios.post(
        `${apiUrl}/search`,
        { ...searchCriteria, dayPeriodCombinations: combinedDayPeriod },
        { params: { calendar_id: defCalendarInfo.id } }
      );

      setResults(response.data.results);
    } catch (err) {
      console.error("検索中にエラー:", err);
      setError('検索中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const formatLectureMessage = (lecture) => (
    <Box key={lecture.id} sx={{ backgroundColor: 'white', margin: '10px 0', padding: '10px', borderRadius: '5px' }}>
      <Typography variant="body1">
        <strong>講義名:</strong> {lecture.科目}
      </Typography>
      <Typography variant="body2">
        <strong>時限:</strong> {lecture.時限}
      </Typography>
      <Typography variant="body2">
        <strong>学年:</strong> {lecture.学年}
      </Typography>
      <Link href={lecture.url} target="_blank" rel="noopener" style={{ display: 'block', marginTop: '10px' }}>
        シラバスを見る
      </Link>
      <Box sx={{ marginTop: 1 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() =>
            navigate('/register-lecture', { state: { lecture } })
          }
        >
          登録/解除
        </Button>
      </Box>
    </Box>
  );

  return (
    <div>
      <Header />
      <div style={{ backgroundColor: '#8fbc8f', minHeight: '100vh', padding: '20px' }}>
        <h1 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>時間割・講義内容検索</h1>

        <Box sx={{ marginBottom: '20px' }}>
          <Typography variant="h6" style={{ color: 'white', marginBottom: '10px' }}>講義名 / Course Title</Typography>
          <input
            id="courseName"
            type="text"
            name="courseName"
            placeholder="科目名を入力"
            value={searchCriteria.courseName}
            onChange={handleInputChange}
            style={{
              color: 'black',
              width: '100%',
              padding: '10px',
              boxSizing: 'border-box',
              borderRadius: '5px',
              border: '1px solid #ccc'
            }}
          />
        </Box>

        <Box sx={{ marginBottom: '20px' }}>
          <Typography variant="h6" style={{ color: 'white', marginBottom: '10px' }}>教員名 / Lecturer</Typography>
          <input
            id="instructorName"
            type="text"
            name="instructorName"
            placeholder="教員名を入力"
            value={searchCriteria.instructorName}
            onChange={handleInputChange}
            style={{
              color: 'black',
              width: '100%',
              padding: '10px',
              boxSizing: 'border-box',
              borderRadius: '5px',
              border: '1px solid #ccc'
            }}
          />
        </Box>

        <Box sx={{ marginBottom: '20px' }}>
          <Typography variant="h6" style={{ color: 'white', marginBottom: '10px' }}>キャンパス / Campus</Typography>
          {CAMUPUSES.map((campus) => (
            <FormControlLabel
              key={campus}
              control={
                <Checkbox
                  checked={searchCriteria.campuses.includes(campus)}
                  onChange={() => handleCheckboxChange('campuses', campus)}
                  sx={{ color: 'white' }}
                />
              }
              label={<Typography style={{ color: 'white' }}>{campus}</Typography>}
            />
          ))}
        </Box>

        <Box sx={{ marginBottom: '20px' }}>
          <Typography variant="h6" style={{ color: 'white', marginBottom: '10px' }}>曜日 / Day</Typography>
          {DAYS.map((day) => (
            <FormControlLabel
              key={day}
              control={
                <Checkbox
                  checked={searchCriteria.days.includes(day)}
                  onChange={() => handleCheckboxChange('days', day)}
                  sx={{ color: 'white' }}
                />
              }
              label={<Typography style={{ color: 'white' }}>{day}</Typography>}
            />
          ))}
        </Box>

        <Box sx={{ marginBottom: '20px' }}>
          <Typography variant="h6" style={{ color: 'white', marginBottom: '10px' }}>時限 / Period</Typography>
          {PERIODS.map((period) => (
            <FormControlLabel
              key={period}
              control={
                <Checkbox
                  checked={searchCriteria.periods.includes(period)}
                  onChange={() => handleCheckboxChange('periods', period)}
                  sx={{ color: 'white' }}
                />
              }
              label={<Typography style={{ color: 'white' }}>{period}</Typography>}
            />
          ))}
        </Box>

        <Box sx={{ marginBottom: '20px' }}>
          <Typography variant="h6" style={{ color: 'white', marginBottom: '10px' }}>
            学年 / Grade
          </Typography>
          {GRADES.map((grade) => (
            <FormControlLabel
              key={grade}
              control={
                <Checkbox
                  checked={searchCriteria.gradeYears.includes(grade)}
                  onChange={() => handleCheckboxChange('gradeYears', grade)}
                  sx={{ color: 'white' }}
                />
              }
              label={<Typography style={{ color: 'white' }}>{grade}年</Typography>}
            />
          ))}
        </Box>

        <Box sx={{ marginBottom: '20px' }}>
          <Typography variant="h6" style={{ color: 'white', marginBottom: '10px' }}>開講学部 / Faculty</Typography>
          {DEPARTMENTS.map((dept) => (
            <FormControlLabel
              key={dept}
              control={
                <Checkbox
                  checked={searchCriteria.departments.includes(dept)}
                  onChange={() => handleCheckboxChange('departments', dept)}
                  sx={{ color: 'white' }}
                />
              }
              label={<Typography style={{ color: 'white' }}>{dept}</Typography>}
            />
          ))}
        </Box>

        <Box sx={{ marginBottom: '20px' }}>
          <Typography variant="h6" style={{ color: 'white', marginBottom: '10px' }}>学期 / Semester</Typography>
          {SEMESTERS.map((sem) => (
            <FormControlLabel
              key={sem}
              control={
                <Checkbox
                  checked={searchCriteria.semesters.includes(sem)}
                  onChange={() => handleCheckboxChange('semesters', sem)}
                  sx={{ color: 'white' }}
                />
              }
              label={<Typography style={{ color: 'white' }}>{sem}</Typography>}
            />
          ))}
        </Box>
        
        

        <Box sx={{ marginBottom: '20px' }}>
          <Typography variant="h6" style={{ color: 'white', marginBottom: '10px' }}>
            授業形態 / Delivery Mode
          </Typography>
          {DELIVERY_MODES.map((mode) => (
            <FormControlLabel
              key={mode}
              control={
                <Checkbox
                  checked={searchCriteria.deliveryModes.includes(mode)}
                  onChange={() => handleCheckboxChange('deliveryModes', mode)}
                  sx={{ color: 'white' }}
                />
              }
              label={<Typography style={{ color: 'white' }}>{mode}</Typography>}
            />
          ))}
        </Box>

        {subjectCategories.length > 0 && (
          <Box sx={{ marginBottom: '20px' }}>
            <Typography variant="h6" style={{ color: 'white', marginBottom: '10px' }}>授業区分（社会情報学部）/ Subject Category</Typography>
            {subjectCategories.map((category) => (
              <FormControlLabel
                key={category}
                control={
                  <Checkbox
                    checked={searchCriteria.subjectCategories.includes(category)}
                    onChange={() => handleCheckboxChange('subjectCategories', category)}
                    sx={{ color: 'white' }}
                  />
                }
                label={<Typography style={{ color: 'white' }}>{category}</Typography>}
              />
            ))}
          </Box>
        )}

        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          }}
        >
          <Button
            onClick={handleSearch}
            disabled={loading}
            variant="contained"
            sx={{
              backgroundColor: '#2e8b57',
              color: 'white',
              fontSize: '16px',
              padding: '10px 20px',
              borderRadius: '5px'
            }}
          >
            {loading ? '検索中...' : '検索 / Search'}
          </Button>
        </Box>

        {error && <Typography style={{ color: 'red', marginTop: '20px' }}>{error}</Typography>}

        <Box sx={{ marginTop: '30px' }}>
          <Typography variant="h5" style={{ color: 'white', textAlign: 'center' }}>検索結果</Typography>
          {results.length > 0 ? (
            <div>{results.map(formatLectureMessage)}</div>
          ) : (
            <Typography style={{ color: 'white', textAlign: 'center' }}>結果がありません。</Typography>
          )}
        </Box>
      </div>
    </div>
  );
};
