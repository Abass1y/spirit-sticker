<script>
    import { onMount } from "svelte";

    // State
    let authCode = "";
    let token = "";
    let friendID = "";
    let selectedSticker = "";
    let isLoading = false;
    const stickers = ["🔥", "💖", "🎉", "👻"];

    // Safe access to SDK
    /**
     * @returns {SuperQiSDK}
     */
    function getMy() {
        if (typeof window !== "undefined" && window.my) {
            return window.my;
        }
        console.warn(
            'SuperQi SDK "my" object not found. Using mock for UI testing.',
        );
        return /** @type {SuperQiSDK} */ ({
            getAuthCode: ({ success }) =>
                setTimeout(
                    () => success && success({ authCode: "mock_auth_123" }),
                    500,
                ),
            scan: ({ success }) =>
                setTimeout(
                    () => success && success({ code: "mock_friend_456" }),
                    500,
                ),
            tradePay: ({ paymentUrl }) =>
                alert(`Opening Payment: ${paymentUrl}`),
            alert: ({ content }) => alert(content),
        });
    }

    async function handleLogin() {
        isLoading = true;
        getMy().getAuthCode({
            scopes: ["auth_base", "USER_ID"],
            success: async (/** @type {{authCode: string}} */ res) => {
                authCode = res.authCode;
                try {
                    // POST authCode to API
                    const response = await fetch(
                        "https://its.mouamle.space/api/auth-with-superQi",
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ token: authCode }),
                        },
                    );

                    if (!response.ok) throw new Error("Auth API failed");

                    const data = await response.json();
                    // Save token
                    if (data.token) {
                        token = data.token;
                        getMy().alert({
                            content: "Login successful",
                        });
                    } else {
                        console.error("No token received:", data);
                        getMy().alert({
                            content:
                                "Authentication failed: No token received.",
                        });
                    }
                } catch (err) {
                    console.error("Login Error:", err);
                    let errorDetails = "";
                    if (err && typeof err === "object") {
                        errorDetails = JSON.stringify(err, null, 2);
                    } else {
                        errorDetails = String(err);
                    }
                    getMy().alert({
                        content: "Error: " + errorDetails,
                    });
                } finally {
                    isLoading = false;
                }
            },
            fail: (/** @type {any} */ err) => {
                console.error("SDK Auth Error:", err);
                isLoading = false;
            },
        });
    }

    function handleTestLogin() {
        isLoading = true;
        setTimeout(() => {
            token = "test_token_" + Date.now();
            isLoading = false;
            getMy().alert({
                content: "Test Login Successful! 🎉",
            });
        }, 500);
    }

    function handleScan() {
        getMy().scan({
            type: "qr",
            success: (/** @type {{code: string}} */ res) => {
                getMy().alert({ title: res.code });
                friendID = res.code;
            },
            fail: (/** @type {any} */ err) => {
                console.error("SDK Scan Error:", err);
            },
        });
    }

    async function handlePay() {
        if (!token) return;
        try {
            // POST to payment API
            const response = await fetch(
                "https://its.mouamle.space/api/payment",
                {
                    method: "POST",
                    headers: {
                        Authorization: token,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        friendID, // Sending friendID as context
                        amount: 1000,
                        sticker: selectedSticker,
                    }),
                },
            );

            if (!response.ok) throw new Error("Payment API failed");

            const data = await response.json();

            if (data.url) {
                // Call tradePay
                getMy().tradePay({
                    paymentUrl: data.url,
                    success: (res) => {
                        getMy().alert({
                            content: "Payment successful",
                        });
                    },
                });
            } else {
                getMy().alert({ content: "No payment URL returned." });
            }
        } catch (err) {
            console.error("Payment Error:", err);
            getMy().alert({ content: "Payment initialization failed." });
        }
    }

    /**
     * @param {string} sticker
     */
    function selectSticker(sticker) {
        selectedSticker = sticker;
    }
</script>

<div class="app-container">
    <!-- Header -->
    <header class="app-header">
        <h1>Spirit Sticker</h1>
    </header>

    <main class="main-content">
        <!-- Step 1: Login -->
        {#if !token}
            <div class="card login-card animate-entry">
                <div class="icon">✨</div>
                <p class="subtitle">Connect to start sending stickers!</p>
                <button on:click={handleLogin} disabled={isLoading} class="btn btn-primary">
                    {#if isLoading}
                        <span class="spinner"></span> Logging in...
                    {:else}
                        Login / Authenticate
                    {/if}
                </button>
                <button on:click={handleTestLogin} disabled={isLoading} class="btn btn-secondary">
                    Test Login (Skip API)
                </button>
            </div>
        {/if}

        <!-- Step 2: Select & Scan -->
        {#if token && !friendID}
            <div class="card">
                <h2 class="section-title">Select a Sticker</h2>

                <!-- Sticker Grid -->
                <div class="sticker-grid">
                    {#each stickers as sticker}
                        <button
                            on:click={() => selectSticker(sticker)}
                            class="sticker-btn {selectedSticker === sticker
                                ? 'selected'
                                : ''}"
                        >
                            {sticker}
                        </button>
                    {/each}
                </div>

                <!-- Scan Button -->
                <div class="action-area">
                    <button
                        on:click={handleScan}
                        disabled={!selectedSticker}
                        class="btn btn-action"
                    >
                        {#if !selectedSticker}
                            <span>Select a Sticker First</span>
                        {:else}
                            <span>Scan Friend QR</span>
                            <span>📸</span>
                        {/if}
                    </button>
                </div>
            </div>
        {/if}

        <!-- Step 3: Payment -->
        {#if friendID}
            <div class="card payment-card">
                <div class="info-group">
                    <span class="label">Sending To</span>
                    <div class="value">{friendID}</div>
                </div>

                <div class="summary">
                    <div class="sticker-preview animate-bounce">
                        {selectedSticker}
                    </div>
                    <div class="price-tag">
                        for <br /> <span>1k</span>
                    </div>
                </div>

                <button on:click={handlePay} class="btn btn-success">
                    Pay 1,000 IQD
                </button>

                <button class="btn-link" on:click={() => (friendID = "")}>
                    Cancel & Scan Again
                </button>
            </div>
        {/if}
    </main>
</div>

<style>
    /* Layout & Container */
    .app-container {
        min-height: 100vh;
        background-color: #f5f5f4; /* stone-100 */
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
    }

    .app-header {
        background-color: #44403c; /* stone-700 */
        color: white;
        padding: 1rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        position: sticky;
        top: 0;
        z-index: 10;
        width: 100%;
        box-sizing: border-box;
    }

    .app-header h1 {
        font-size: 1.25rem;
        font-weight: 700;
        text-align: center;
        letter-spacing: 0.05em;
        margin: 0;
    }

    .main-content {
        flex-grow: 1;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
        width: 100%;
        max-width: 480px; /* Mobile width */
        margin: 0 auto;
        box-sizing: border-box;
    }

    /* Cards */
    .card {
        background-color: white;
        padding: 1.5rem;
        border-radius: 1.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-sizing: border-box;
    }

    .login-card {
        padding: 2rem;
    }

    .payment-card {
        text-align: center;
        border-top: 4px solid #22c55e; /* green-500 */
    }

    /* Typography */
    .section-title {
        color: #44403c; /* stone-700 */
        font-weight: 700;
        margin-bottom: 1rem;
        text-align: center;
        font-size: 1.125rem;
        margin-top: 0;
    }

    .icon {
        margin-bottom: 1.5rem;
        font-size: 3.75rem;
    }

    .subtitle {
        color: #57534e; /* stone-600 */
        margin-bottom: 1.5rem;
        text-align: center;
        font-weight: 500;
    }

    .label {
        font-size: 0.75rem;
        font-weight: 700;
        color: #a8a29e; /* stone-400 */
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .value {
        font-size: 1.125rem;
        font-family: monospace;
        font-weight: 700;
        color: #292524; /* stone-800 */
        background-color: #f5f5f4; /* stone-100 */
        border-radius: 0.5rem;
        padding: 0.5rem;
        margin-top: 0.25rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
    }

    /* Sticker Grid */
    .sticker-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin-bottom: 1.5rem;
        width: 100%;
    }

    .sticker-btn {
        aspect-ratio: 1/1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        border-radius: 1rem;
        border: 2px solid #f5f5f4; /* stone-100 */
        background-color: transparent;
        transition: all 0.2s;
        cursor: pointer;
    }

    .sticker-btn:hover {
        background-color: #fafaf9; /* stone-50 */
    }

    .sticker-btn.selected {
        border-color: #f97316; /* orange-500 */
        background-color: #fff7ed; /* orange-50 */
        transform: scale(1.05);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    /* Buttons */
    .btn {
        width: 100%;
        color: white;
        font-weight: 700;
        padding: 0.75rem 2rem;
        border-radius: 9999px;
        border: none;
        cursor: pointer;
        transition:
            transform 0.1s,
            box-shadow 0.1s;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        font-size: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }

    .btn:hover {
        transform: scale(1.02);
    }

    .btn:active {
        transform: scale(0.98);
    }

    .btn:disabled {
        background-color: #d6d3d1; /* stone-300 */
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }

    .btn-primary {
        background-color: #292524; /* stone-800 */
        padding: 1rem 2rem; /* Larger */
    }
    .btn-primary:hover {
        background-color: #1c1917;
    }

    .btn-secondary {
        background-color: #64748b; /* slate-500 */
        padding: 0.75rem 1.5rem;
        font-size: 0.875rem;
        margin-top: 0.75rem;
    }
    .btn-secondary:hover {
        background-color: #475569;
    }

    .btn-action {
        background-color: #2563eb; /* blue-600 */
        padding: 1rem;
    }
    .btn-action:hover {
        background-color: #1d4ed8;
    }

    .btn-success {
        background-color: #059669; /* emerald-600 */
        padding: 1rem 1.5rem;
        font-size: 1.125rem;
    }
    .btn-success:hover {
        background-color: #047857;
    }

    .btn-link {
        margin-top: 1.5rem;
        color: #a8a29e; /* stone-400 */
        font-size: 0.875rem;
        background: none;
        border: none;
        text-decoration: underline;
        cursor: pointer;
    }
    .btn-link:hover {
        color: #57534e;
    }

    .action-area {
        margin-top: 1rem;
        width: 100%;
    }

    .info-group {
        margin-bottom: 1rem;
        width: 100%;
        text-align: left;
    }

    /* Summary */
    .summary {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin: 2rem 0;
    }

    .price-tag {
        color: #a8a29e; /* stone-400 */
        font-weight: 700;
        font-size: 1.25rem;
        line-height: 1.2;
    }
    .price-tag span {
        color: #292524; /* stone-800 */
    }

    /* Animations */
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    .animate-entry {
        animation: fadeIn 0.5s ease-out forwards;
    }

    @keyframes bounce {
        0%,
        100% {
            transform: translateY(-5%);
        }
        50% {
            transform: translateY(5%);
        }
    }
    .animate-bounce {
        animation: bounce 1s infinite;
        font-size: 3.75rem;
    }

    /* Loading Spinner */
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
    .spinner {
        display: inline-block;
        width: 1rem;
        height: 1rem;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-right: 0.5rem;
    }
</style>
