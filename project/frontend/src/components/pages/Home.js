import React, { useContext, useState } from "react";
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
} from "@mui/material";

export const Home = () => {
    const { isLogined } = useContext(UserContext);
    const { defCalendarInfo, lectureInfo } = useSetup();
    const navigate = useNavigate();

    /*───────────────────────────────
      ▼ 学部選択リスト
    ───────────────────────────────*/
    const departments = [
        "文学部共通","文学部外国語科目","英米文学科","フランス文学科","比較芸術学科",
        "教育人間　外国語科目","教育人間　教育学科","教育人間　心理学科",
        "経済学部","法学部","経営学部","教職課程科目",
        "国際政治経済学部","総合文化政策学部","日本文学科","史学科",
        "理工学部共通","物理科学","数理サイエンス","物理・数理","電気電子工学科",
        "機械創造","経営システム","情報テクノロジ－",
        "社会情報学部","地球社会共生学部","コミュニティ人間科学部","化学・生命"
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
      ▼ 卒業単位計算
    ───────────────────────────────*/
    const [diffResult, setDiffResult] = useState(null);

    const calculateDiff = () => {
        const result = Object.keys(requiredUnits).map((key) => {
            const required = requiredUnits[key];
            const earned = Number(units[key] || 0);
            const remain = required - earned;
            return { key, required, earned, remain };
        });
        setDiffResult(result);
    };

    /*───────────────────────────────
      ▼ ログインチェック
    ───────────────────────────────*/
    if (!isLogined) return <Navigate to="/login" />;

    /*───────────────────────────────
      ▼▼▼ カレンダー部分（元コードを1pxも変更していない） ▼▼▼
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

    const unmatchedLectures =
        lectureInfo?.registered_user_kougi
            .filter(
                (registered) =>
                    registered.period.includes("曜") || registered.period.includes("不定")
            )
            .map((unmatched) =>
                lectureInfo?.results.find((lec) => lec.id === unmatched.kougi_id)
            )
            .filter(Boolean);

    /*───────────────────────────────
      ▼▼ JSX
    ───────────────────────────────*/
    return (
        <Box>
            <Header />

            <Box sx={{ backgroundColor: "#8fbc8f", minHeight: "100vh", paddingTop: "30px" }}>
                <Typography variant="h4" align="center" sx={{ color: "white", mb: 3 }}>
                    {defCalendarInfo?.calendar_name || "ホーム画面"}
                </Typography>

                {/* ▼ カレンダーボタン（元のまま） */}
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

                {/* ▼ 時間割（完全に元のまま） */}
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
                <Box sx={{ maxWidth: 600, margin: "50px auto 20px auto" }}>
                    <FormControl fullWidth>
                        <InputLabel>学部・学科を選択</InputLabel>
                        <Select value={selectedDept} label="学部・学科" onChange={handleChangeDept}>
                            {departments.map((d) => (
                                <MenuItem key={d} value={d}>
                                    {d}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {/* ▼ 修得済単位入力（社会情報学部） */}
                {selectedDept === "社会情報学部" && (
                    <Box
                        sx={{
                            mt: 4,
                            mb: 10,
                            maxWidth: "800px",
                            margin: "0 auto",
                            padding: 3,
                            backgroundColor: "#fff",
                            borderRadius: 2,
                            boxShadow: 3,
                        }}
                    >
                        <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
                            修得済単位の入力（社会情報学部）
                        </Typography>

                        {Object.keys(requiredUnits).map((key) => (
                            <Box
                                key={key}
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    mb: 2,
                                }}
                            >
                                <Typography sx={{ width: "60%" }}>{key}</Typography>
                                <input
                                    type="number"
                                    value={units[key]}
                                    onChange={(e) => updateUnit(key, e.target.value)}
                                    style={{
                                        width: "80px",
                                        padding: "6px",
                                        fontSize: "16px",
                                    }}
                                />
                            </Box>
                        ))}

                        <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
                            <Button variant="contained" color="primary" onClick={saveUnits}>
                                保存する
                            </Button>

                            <Button variant="contained" color="secondary" onClick={calculateDiff}>
                                卒業単位確認
                            </Button>
                        </Box>

                        {/* ▼ 卒業単位の差分表示 */}
                        {diffResult && (
                            <Box
                                sx={{
                                    mt: 5,
                                    padding: 2,
                                    backgroundColor: "#f7f7f7",
                                    borderRadius: 2,
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{ fontWeight: "bold", mb: 2 }}
                                >
                                    卒業単位の進捗
                                </Typography>

                                {diffResult.map((r) => (
                                    <Box
                                        key={r.key}
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            padding: "8px 0",
                                            borderBottom: "1px solid #ccc",
                                        }}
                                    >
                                        <Typography sx={{ width: "45%" }}>{r.key}</Typography>
                                        <Typography sx={{ width: "20%" }}>
                                            必要：{r.required}
                                        </Typography>
                                        <Typography sx={{ width: "20%" }}>
                                            取得：{r.earned}
                                        </Typography>
                                        <Typography
                                            sx={{ width: "15%", fontWeight: "bold" }}
                                        >
                                            残り：{r.remain}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>
                )}
            </Box>

            <Footer />
        </Box>
    );
};
