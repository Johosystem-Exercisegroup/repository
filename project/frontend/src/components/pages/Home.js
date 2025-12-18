import React, { useContext, useState, useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { UserContext } from "../providers/UserProvider";
import { Header } from "../templates/Header";
import { Footer } from "../templates/Footer";
import { useSetup } from "../hooks/useSetup";
import {
    Box,
    Button,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    LinearProgress,
    Card,
    CardContent,
    Divider,
    Grid,
    Chip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export const Home = () => {
    const { isLogined } = useContext(UserContext);
    const { defCalendarInfo, lectureInfo } = useSetup();
    const navigate = useNavigate();

    /*───────────────────────────────
      ▼ 学部選択リスト
    ───────────────────────────────*/
    const departments = [
        "文学部共通", "文学部外国語科目", "英米文学科", "フランス文学科", "比較芸術学科",
        "教育人間　外国語科目", "教育人間　教育学科", "教育人間　心理学科",
        "経済学部", "法学部", "経営学部", "教職課程科目",
        "国際政治経済学部", "総合文化政策学部", "日本文学科", "史学科",
        "理工学部共通", "物理科学", "数理サイエンス", "物理・数理", "電気電子工学科",
        "機械創造", "経営システム", "情報テクノロジ－",
        "社会情報学部", "地球社会共生学部", "コミュニティ人間科学部", "化学・生命"
    ];

    const [selectedDept, setSelectedDept] = useState(
        localStorage.getItem("selectedDept") || ""
    );

    const handleChangeDept = (e) => {
        setSelectedDept(e.target.value);
        localStorage.setItem("selectedDept", e.target.value);
    };

    /*───────────────────────────────
      ▼ 社会情報学部：必要単位表
    ───────────────────────────────*/
    const requiredUnits = {
        "青山スタンダード科目": 26,
        "英語基礎科目": 8,
        "コア科目": 14,
        "基礎科目": 6,
        "基礎科目（数理系）": 2,
        "演習科目": 8,
        "リエゾン科目": 12,
        "自己コースエリアA": 8,
        "自己コースエリアB": 8,
        "専門選択科目": 24,
        "自由選択科目": 8,
    };

    const unitTemplate = Object.keys(requiredUnits).reduce((acc, key) => {
        acc[key] = "";
        return acc;
    }, {});

    /*───────────────────────────────
      ▼ 修得単位 state
    ───────────────────────────────*/
    const [units, setUnits] = useState(() => {
        const saved = localStorage.getItem("userUnits");
        return saved ? JSON.parse(saved) : unitTemplate;
    });

    const updateUnit = (key, value) => {
        // 0未満の入力は防ぐなどの制御も可能ですが、ここではシンプルに
        if (value === "") {
            setUnits({ ...units, [key]: "" });
            return;
        }
        setUnits({ ...units, [key]: Number(value) });
    };

    const saveUnits = () => {
        localStorage.setItem("userUnits", JSON.stringify(units));
        alert("保存しました！");
    };

    /*───────────────────────────────
      ▼ リアルタイム計算ロジック（改善点）
    ───────────────────────────────*/
    // 入力値が変わるたびに自動で計算結果を生成します
    const progressData = useMemo(() => {
        if (selectedDept !== "社会情報学部") return null;

        let totalRequired = 0;
        let totalEarned = 0;

        const details = Object.keys(requiredUnits).map((key) => {
            const required = requiredUnits[key];
            const earned = Number(units[key] || 0);
            const remain = Math.max(0, required - earned);
            const progress = Math.min(100, (earned / required) * 100);
            const isComplete = earned >= required;

            totalRequired += required;
            totalEarned += earned;

            return { key, required, earned, remain, progress, isComplete };
        });

        const totalProgress = Math.min(100, (totalEarned / totalRequired) * 100);

        return { details, totalRequired, totalEarned, totalProgress };
    }, [units, selectedDept]); // requiredUnitsは定数なので依存配列から除外

    /*───────────────────────────────
      ▼ ログインチェック
    ───────────────────────────────*/
    if (!isLogined) return <Navigate to="/login" />;

    /*───────────────────────────────
      ▼▼▼ カレンダー部分（変更なし） ▼▼▼
    ───────────────────────────────*/
    const createCalendar = () => {
        const days = ["月", "火", "水", "木", "金"];
        if (defCalendarInfo?.sat_flag) days.push("土");

        const maxPeriods = defCalendarInfo?.sixth_period_flag ? 6 : 5;

        const lectureMap =
            lectureInfo?.registered_user_kougi.reduce((map, lecture) => {
                map[lecture.period] = lecture.kougi_id;
                return map;
            }, {}) || {};

        const lectureDetails =
            lectureInfo?.results.reduce((map, lecture) => {
                map[lecture.id] = lecture;
                return map;
            }, {}) || {};

        let rows = [];
        for (let i = 1; i <= maxPeriods; i++) {
            let cells = [];
            for (let j = 0; j <= days.length; j++) {
                let content = "";
                let lecture = null;

                if (j === 0) {
                    content = `${i}限`;
                    cells.push(
                        <TableCell
                            key={`${i}-${j}`}
                            align="center"
                            sx={{
                                backgroundColor: "#e0f7fa",
                                border: "1px solid #ddd",
                                fontWeight: "bold",
                                padding: 0,
                                maxWidth: "180px",
                                maxHeight: "80px",
                            }}
                        >
                            <Typography>{content}</Typography>
                        </TableCell>
                    );
                } else {
                    const day = days[j - 1];
                    const period = i.toString();
                    const buttonId = `${day}${period}`.replace(/\d/, (d) =>
                        String.fromCharCode(d.charCodeAt(0) + 0xfee0)
                    );
                    const lectureId = lectureMap[buttonId];
                    lecture = lectureDetails[lectureId];
                    content = lecture?.科目 || "－";

                    cells.push(
                        <TableCell
                            key={`${i}-${j}`}
                            align="center"
                            sx={{
                                backgroundColor: "white",
                                border: "1px solid #ddd",
                                padding: 0,
                                maxWidth: "180px",
                                maxHeight: "80px",
                                overflow: "hidden",
                            }}
                        >
                            <Button
                                fullWidth
                                sx={{
                                    height: "100%",
                                    padding: 0,
                                    maxWidth: "180px",
                                    minHeight: "80px",
                                }}
                                variant="contained"
                                color={lecture ? "primary" : "default"}
                                onClick={() =>
                                    lecture
                                        ? navigate("/register-lecture", { state: { lecture } })
                                        : navigate("/search", {
                                            state: { days: [day], periods: [period.toUpperCase()] },
                                        })
                                }
                            >
                                {content}
                            </Button>
                        </TableCell>
                    );
                }
            }
            rows.push(<TableRow key={i}>{cells}</TableRow>);
        }

        return rows;
    };

    /*───────────────────────────────
      ▼▼ JSX
    ───────────────────────────────*/
    return (
        <Box>
            <Header />

            <Box sx={{ backgroundColor: "#8fbc8f", minHeight: "100vh", paddingTop: "30px", pb: 10 }}>
                <Typography variant="h4" align="center" sx={{ color: "white", mb: 3 }}>
                    {defCalendarInfo?.calendar_name || "ホーム画面"}
                </Typography>

                {/* ▼ カレンダーボタン */}
                <Box
                    sx={{
                        margin: 3,
                        display: "flex",
                        flexWrap: "nowrap",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <Button variant="contained" onClick={() => navigate("/calendar/create")}>
                        新規カレンダー作成
                    </Button>
                    <Button variant="contained" onClick={() => navigate("/calendar/list")}>
                        保存済みのカレンダー
                    </Button>
                </Box>

                {/* ▼ 時間割 */}
                {defCalendarInfo ? (
                    <Box
                        sx={{
                            mt: 4,
                            maxWidth: "1200px",
                            margin: "0 auto",
                            overflowX: "auto",
                            borderRadius: 2,
                        }}
                    >
                        <TableContainer
                            component={Paper}
                            sx={{
                                width: "100%",
                                margin: { xs: 0, sm: "0 auto" },
                                borderRadius: 2,
                                overflow: "hidden",
                            }}
                        >
                            <Table sx={{ tableLayout: "fixed", width: "100%" }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: "bold",
                                                backgroundColor: "#008080",
                                                color: "white",
                                            }}
                                        />
                                        {["月", "火", "水", "木", "金", defCalendarInfo?.sat_flag && "土"]
                                            .filter(Boolean)
                                            .map((day) => (
                                                <TableCell
                                                    key={day}
                                                    align="center"
                                                    sx={{
                                                        fontWeight: "bold",
                                                        backgroundColor: "#008080",
                                                        color: "white",
                                                    }}
                                                >
                                                    {day}
                                                </TableCell>
                                            ))}
                                    </TableRow>
                                </TableHead>

                                <TableBody>{createCalendar()}</TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                ) : (
                    <Typography align="center" sx={{ color: "white", mt: 4 }}>
                        未設定
                    </Typography>
                )}

                {/* ▼ 学部選択 */}
                <Box sx={{ maxWidth: 600, margin: "50px auto 20px auto", px: 2 }}>
                    <Card sx={{ p: 2, borderRadius: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>学部・学科を選択して単位を確認</InputLabel>
                            <Select value={selectedDept} label="学部・学科を選択して単位を確認" onChange={handleChangeDept}>
                                {departments.map((d) => (
                                    <MenuItem key={d} value={d}>
                                        {d}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Card>
                </Box>

                {/* ▼ 修得済単位入力＆計算（大幅リニューアル） */}
                {selectedDept === "社会情報学部" && progressData && (
                    <Box sx={{ maxWidth: "900px", margin: "0 auto", px: 2 }}>
                        <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
                            <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                                
                                {/* 1. タイトルと保存ボタン */}
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                                    <Typography variant="h5" sx={{ fontWeight: "bold", color: "#333" }}>
                                        卒業単位チェッカー
                                    </Typography>
                                    <Button variant="contained" size="large" onClick={saveUnits} color="primary">
                                        情報を保存
                                    </Button>
                                </Box>

                                {/* 2. 全体の進捗サマリー */}
                                <Paper variant="outlined" sx={{ p: 2, mb: 4, backgroundColor: "#f9f9f9", borderColor: "#ddd" }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                        <Typography variant="subtitle1" fontWeight="bold">総合進捗</Typography>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {progressData.totalEarned} / {progressData.totalRequired} 単位
                                        </Typography>
                                    </Box>
                                    <LinearProgress 
                                        variant="determinate" 
                                        value={progressData.totalProgress} 
                                        sx={{ height: 10, borderRadius: 5 }} 
                                    />
                                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block", textAlign: "right" }}>
                                        卒業まであと {Math.max(0, progressData.totalRequired - progressData.totalEarned)} 単位
                                    </Typography>
                                </Paper>

                                <Divider sx={{ mb: 4 }} />

                                {/* 3. カテゴリごとの入力リスト */}
                                <Grid container spacing={3}>
                                    {progressData.details.map((item) => (
                                        <Grid item xs={12} key={item.key}>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                    justifyContent: "space-between",
                                                    flexDirection: { xs: "column", sm: "row" },
                                                    gap: 2
                                                }}
                                            >
                                                {/* 科目名 */}
                                                <Box sx={{ flex: 1, minWidth: "150px", pt: 1 }}>
                                                    <Typography variant="body1" fontWeight="bold">
                                                        {item.key}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        必要単位: {item.required}
                                                    </Typography>
                                                </Box>

                                                {/* 入力欄 */}
                                                <Box sx={{ width: { xs: "100%", sm: "120px" } }}>
                                                    <TextField
                                                        type="number"
                                                        label="取得"
                                                        value={units[item.key]}
                                                        onChange={(e) => updateUnit(item.key, e.target.value)}
                                                        variant="outlined"
                                                        size="small"
                                                        fullWidth
                                                        InputProps={{ inputProps: { min: 0 } }}
                                                    />
                                                </Box>

                                                {/* 進捗バーと残り単位 */}
                                                <Box sx={{ flex: 2, width: "100%", pt: 1 }}>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                                        <Box sx={{ width: "100%", mr: 1 }}>
                                                            <LinearProgress 
                                                                variant="determinate" 
                                                                value={item.progress} 
                                                                color={item.isComplete ? "success" : "primary"}
                                                                sx={{ height: 8, borderRadius: 4 }}
                                                            />
                                                        </Box>
                                                        <Box sx={{ minWidth: 35 }}>
                                                            {item.isComplete ? (
                                                                <CheckCircleIcon color="success" />
                                                            ) : (
                                                                <Typography variant="body2" color="textSecondary">{`${Math.round(item.progress)}%`}</Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                                        {item.isComplete ? (
                                                            <Chip label="完了" size="small" color="success" variant="outlined" />
                                                        ) : (
                                                            <Typography variant="caption" sx={{ color: "error.main", fontWeight: "bold" }}>
                                                                あと {item.remain} 単位
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Box>
                                            <Divider sx={{ mt: 2, display: { xs: "block", sm: "none" } }} />
                                        </Grid>
                                    ))}
                                </Grid>

                            </CardContent>
                        </Card>
                    </Box>
                )}
            </Box>

            <Footer />
        </Box>
    );
};

            <Footer />
        </Box>
    );
};
