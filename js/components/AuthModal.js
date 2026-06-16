export function AuthModal() {
    return `
    <div class="modal" id="authModal" data-js="authModal" role="dialog" aria-modal="true" aria-labelledby="authTitle" aria-hidden="true" hidden>
        <div class="modal-content">
            <div class="modal-header">
                <div>
                    <h2 id="authTitle" data-js="authModalTitle">Login</h2>
                </div>
                <button class="modal-close" id="closeAuthBtn" data-js="closeAuthBtn" type="button" aria-label="Tutup">&times;</button>
            </div>

            <div class="modal-body">
                <div class="auth-tabs">
                    <div class="auth-tab active" data-tab="login" data-js="loginTab">Login</div>
                    <div class="auth-tab" data-tab="register" data-js="registerTab">Register</div>
                </div>

                <!-- Login Form -->
                <form id="loginForm" data-js="loginForm">
                    <div class="auth-form-group">
                        <label for="loginEmail">Email</label>
                        <input type="email" id="loginEmail" name="email" placeholder="nama@email.com" required autocomplete="email">
                    </div>
                    <div class="auth-form-group">
                        <label for="loginPassword">Password</label>
                        <input type="password" id="loginPassword" name="password" placeholder="********" required autocomplete="current-password">
                    </div>
                    <button type="submit" class="btn btn-primary w-full" style="width: 100%; margin-top: 10px;">Masuk</button>
                    <p style="margin-top: 16px; text-align: center; font-size: 0.9rem;">
                        Belum punya akun? <span class="auth-toggle-link" data-js="switchToRegister">Daftar sekarang</span>
                    </p>
                </form>

                <!-- Register Form -->
                <form id="registerForm" data-js="registerForm" hidden>
                    <div class="auth-form-group">
                        <label for="regName">Nama Lengkap</label>
                        <input type="text" id="regName" name="name" placeholder="Nama Lengkap" required autocomplete="name">
                    </div>
                    <div class="auth-form-group">
                        <label for="regEmail">Email</label>
                        <input type="email" id="regEmail" name="email" placeholder="nama@email.com" required autocomplete="email">
                    </div>
                    <div class="auth-form-group">
                        <label for="regPassword">Password</label>
                        <input type="password" id="regPassword" name="password" placeholder="********" required autocomplete="new-password">
                    </div>
                    <button type="submit" class="btn btn-primary w-full" style="width: 100%; margin-top: 10px;">Daftar</button>
                    <p style="margin-top: 16px; text-align: center; font-size: 0.9rem;">
                        Sudah punya akun? <span class="auth-toggle-link" data-js="switchToLogin">Masuk di sini</span>
                    </p>
                </form>
            </div>
        </div>
    </div>
    `;
}