import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, TextField, Button } from '@mui/material';
import { Link, useSearchParams } from "react-router-dom";
import { useLogin } from '../hooks/useLogin';

export const Login = () => {
    const { login } = useLogin();
    const [searchParams] = useSearchParams(); // クエリパラメータを取得
    const [user, setUser] = useState({
        username: "",
        password: "",
    });

    useEffect(() => {
        // クエリパラメータからusernameとpasswordを取得して初期値に設定
        const username = searchParams.get('username');
        const password = searchParams.get('password');
        setUser({
            username: username || "",
            password: password || "",
        });
    }, [searchParams]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser({ ...user, [name]: value });
    };

    const onClickLogin = () => {
        console.log('ログインボタンがクリックされました', user);
        login(user);
    };

    return (
        <Container maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography variant="h5">
                    ログイン画面
                </Typography>
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="username"
                    label="名前"
                    id="username"
                    value={user.username} // フォームの値をstateから反映
                    onChange={handleChange}
                />
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    value={user.password} // フォームの値をstateから反映
                    autoComplete="current-password"
                    onChange={handleChange}
                />
                <Button
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                    onClick={onClickLogin}
                >
                    ログイン
                </Button>
                <Link to="/register">新規登録はこちら</Link>
            </Box>
        </Container>
    );
};
