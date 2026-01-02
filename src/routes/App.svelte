<script>
    import { onMount } from "svelte";

    // State
    let token = "";
    let friendID = "";
    let isLoading = false;
    let currentView = "shop"; // shop, collection, send
    let selectedSticker = null;

    const stickers = [
        { id: 1, emoji: "🔥", name: "Fire", price: 500, rarity: "common" },
        { id: 2, emoji: "💖", name: "Love", price: 1000, rarity: "rare" },
        { id: 3, emoji: "🎉", name: "Party", price: 750, rarity: "uncommon" },
        { id: 4, emoji: "👻", name: "Ghost", price: 1500, rarity: "epic" },
        { id: 5, emoji: "⭐", name: "Star", price: 800, rarity: "uncommon" },
        { id: 6, emoji: "🌙", name: "Moon", price: 1200, rarity: "rare" },
        { id: 7, emoji: "🎁", name: "Gift", price: 600, rarity: "common" },
        { id: 8, emoji: "💎", name: "Diamond", price: 2000, rarity: "legendary" },
    ];

    let myStickers = {}; // { stickerId: count }

    function getMy() {
        if (typeof window !== "undefined" && window.my) {
            return window.my;
        }
        return {
            getAuthCode: ({ success }) =>
                setTimeout(() => success && success({ authCode: "mock_auth_123" }), 500),
            scan: ({ success }) =>
                setTimeout(() => success && success({ code: "mock_friend_456" }), 500),
            tradePay: ({ paymentUrl }) =>
                alert(`Opening Payment: ${paymentUrl}`),
            alert: ({ content }) => alert(content),
        };
    }

    function handleTestLogin() {
        isLoading = true;
        setTimeout(() => {
            token = "test_token_" + Date.now();
            isLoading = false;
            getMy().alert({ content: "Test Login Successful! 🎉" });
        }, 500);
    }

    function buyStickerWithPayment(sticker) {
        if (!token) return;
        isLoading = true;

        // Simulate payment API call
        setTimeout(() => {
            // Add sticker to collection
            myStickers[sticker.id] = (myStickers[sticker.id] || 0) + 1;
            myStickers = myStickers; // Trigger reactivity
            isLoading = false;
            getMy().alert({
                content: `✅ Bought ${sticker.name}! ${sticker.emoji}`,
            });
        }, 800);
    }

    function sendSticker(sticker) {
        if (!token || !friendID || !myStickers[sticker.id]) return;

        isLoading = true;
        setTimeout(() => {
            myStickers[sticker.id]--;
            myStickers = myStickers;
            isLoading = false;
            getMy().alert({
                content: `🎉 Sent ${sticker.name} ${sticker.emoji} to ${friendID}!`,
            });
            friendID = "";
            currentView = "collection";
        }, 800);
    }

    function startSendFlow(sticker) {
        selectedSticker = sticker;
        currentView = "send";
    }

    function scanFriend() {
        getMy().scan({
            type: "qr",
            success: (res) => {
                friendID = res.code;
                getMy().alert({ title: "Friend scanned: " + res.code });
            },
            fail: (err) => {
                console.error("Scan error:", err);
            },
        });
    }

    function logout() {
        token = "";
        myStickers = {};
        currentView = "shop";
        selectedSticker = null;
    }
</script>

<div class="app-container">
    <!-- Header -->
    <header class="app-header">
        <h1>🎟️ Spirit Sticker Shop</h1>
        {#if token}
            <div class="header-nav">
                <button 
                    class="nav-btn {currentView === 'shop' ? 'active' : ''}"
                    on:click={() => currentView = 'shop'}
                >
                    Shop
                </button>
                <button 
                    class="nav-btn {currentView === 'collection' ? 'active' : ''}"
                    on:click={() => currentView = 'collection'}
                >
                    My Collection ({Object.values(myStickers).reduce((a, b) => a + b, 0)})
                </button>
                <button class="nav-btn logout-btn" on:click={logout}>
                    Logout
                </button>
            </div>
        {/if}
    </header>

    <main class="main-content">
        <!-- Login Screen -->
        {#if !token}
            <div class="card login-card animate-entry">
                <div class="icon">✨</div>
                <p class="subtitle">Welcome to Spirit Sticker Shop!</p>
                <p style="font-size: 0.9rem; color: #57534e;">Buy and send unique stickers to your friends</p>
                <button on:click={handleTestLogin} disabled={isLoading} class="btn btn-primary">
                    {#if isLoading}
                        <span class="spinner"></span> Logging in...
                    {:else}
                        Start Shopping 🛍️
                    {/if}
                </button>
            </div>
        {/if}

        <!-- Shop View -->
        {#if token && currentView === 'shop'}
            <div class="shop-view">
                <h2 class="section-title">🎟️ Available Stickers</h2>
                <div class="sticker-shop-grid">
                    {#each stickers as sticker (sticker.id)}
                        <div class="sticker-card">
                            <div class="sticker-emoji">{sticker.emoji}</div>
                            <h3 class="sticker-name">{sticker.name}</h3>
                            <span class="rarity-badge {sticker.rarity}">
                                {sticker.rarity}
                            </span>
                            <div class="sticker-price">{sticker.price} IQD</div>
                            <button 
                                on:click={() => buyStickerWithPayment(sticker)}
                                disabled={isLoading}
                                class="btn btn-buy"
                            >
                                {#if isLoading}
                                    <span class="spinner"></span> Buying...
                                {:else}
                                    Buy Now
                                {/if}
                            </button>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- Collection View -->
        {#if token && currentView === 'collection'}
            <div class="collection-view">
                <h2 class="section-title">📦 Your Collection</h2>
                {#if Object.keys(myStickers).length === 0}
                    <div class="empty-state">
                        <p>You don't have any stickers yet!</p>
                        <button 
                            class="btn btn-primary"
                            on:click={() => currentView = 'shop'}
                        >
                            Go to Shop 🛍️
                        </button>
                    </div>
                {:else}
                    <div class="collection-grid">
                        {#each stickers as sticker (sticker.id)}
                            {#if myStickers[sticker.id]}
                                <div class="collection-card">
                                    <div class="sticker-emoji">{sticker.emoji}</div>
                                    <h3 class="sticker-name">{sticker.name}</h3>
                                    <div class="sticker-count">×{myStickers[sticker.id]}</div>
                                    <button 
                                        on:click={() => startSendFlow(sticker)}
                                        class="btn btn-send"
                                    >
                                        Send 🎁
                                    </button>
                                </div>
                            {/if}
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}

        <!-- Send Sticker View -->
        {#if token && currentView === 'send' && selectedSticker}
            <div class="card send-card animate-entry">
                <button 
                    class="btn-back"
                    on:click={() => currentView = 'collection'}
                >
                    ← Back
                </button>
                
                <h2 class="section-title">Send {selectedSticker.name}</h2>
                
                <div class="send-preview">
                    <div class="sticker-emoji">{selectedSticker.emoji}</div>
                    <p>×{myStickers[selectedSticker.id]}</p>
                </div>

                {#if !friendID}
                    <p class="subtitle">Scan your friend's QR code</p>
                    <button 
                        on:click={scanFriend}
                        class="btn btn-primary"
                    >
                        📸 Scan QR Code
                    </button>
                {:else}
                    <div class="info-group">
                        <span class="label">Sending to</span>
                        <div class="value">{friendID}</div>
                    </div>
                    
                    <button 
                        on:click={() => sendSticker(selectedSticker)}
                        disabled={isLoading}
                        class="btn btn-success"
                    >
                        {#if isLoading}
                            <span class="spinner"></span> Sending...
                        {:else}
                            Send {selectedSticker.emoji}
                        {/if}
                    </button>
                    
                    <button 
                        class="btn-link"
                        on:click={() => friendID = ''}
                    >
                        Scan Different QR
                    </button>
                {/if}
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
        margin: 0 0 0.5rem 0;
    }

    .header-nav {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        margin-top: 0.5rem;
        flex-wrap: wrap;
    }

    .nav-btn {
        background-color: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.85rem;
        transition: all 0.2s;
    }

    .nav-btn:hover {
        background-color: rgba(255, 255, 255, 0.3);
    }

    .nav-btn.active {
        background-color: #f97316; /* orange-500 */
    }

    .logout-btn {
        margin-left: auto;
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

    /* Sticker Cards - Shop & Collection */
    .sticker-shop-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
        width: 100%;
    }

    .sticker-card,
    .collection-card {
        background-color: white;
        border: 2px solid #e7e5e4;
        border-radius: 1rem;
        padding: 1rem;
        text-align: center;
        transition: all 0.3s;
        cursor: pointer;
    }

    .sticker-card:hover,
    .collection-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px -2px rgba(0, 0, 0, 0.1);
        border-color: #f97316;
    }

    .sticker-emoji {
        font-size: 3rem;
        margin-bottom: 0.5rem;
        display: block;
    }

    .sticker-name {
        font-size: 0.95rem;
        font-weight: 700;
        color: #292524;
        margin: 0.5rem 0;
    }

    .rarity-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        margin-bottom: 0.75rem;
    }

    .rarity-badge.common {
        background-color: #d1d5db;
        color: #374151;
    }

    .rarity-badge.uncommon {
        background-color: #bbf7d0;
        color: #065f46;
    }

    .rarity-badge.rare {
        background-color: #bfdbfe;
        color: #1e40af;
    }

    .rarity-badge.epic {
        background-color: #d8b4fe;
        color: #581c87;
    }

    .rarity-badge.legendary {
        background-color: #fcd34d;
        color: #92400e;
    }

    .sticker-price {
        font-size: 1.25rem;
        font-weight: 700;
        color: #f97316;
        margin-bottom: 0.75rem;
    }

    .sticker-count {
        font-size: 1.25rem;
        font-weight: 700;
        color: #059669;
        margin-bottom: 0.75rem;
    }

    .btn-buy,
    .btn-send {
        background-color: #f97316; /* orange */
        padding: 0.6rem 1rem;
        font-size: 0.9rem;
        width: 100%;
    }

    .btn-buy:hover,
    .btn-send:hover {
        background-color: #ea580c;
    }

    .collection-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 1rem;
        width: 100%;
    }

    .empty-state {
        text-align: center;
        padding: 2rem;
        color: #57534e;
    }

    .empty-state p {
        font-size: 1.1rem;
        margin-bottom: 1rem;
    }

    .shop-view,
    .collection-view {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .send-card {
        width: 100%;
        max-width: 480px;
    }

    .btn-back {
        align-self: flex-start;
        background: none;
        border: none;
        color: #f97316;
        font-weight: 700;
        cursor: pointer;
        padding: 0;
        margin-bottom: 1rem;
        font-size: 1rem;
    }

    .btn-back:hover {
        color: #ea580c;
    }

    .send-preview {
        text-align: center;
        padding: 2rem;
    }

    .send-preview .sticker-emoji {
        font-size: 4rem;
        margin-bottom: 0.5rem;
    }

    .send-preview p {
        font-size: 1.5rem;
        color: #f97316;
        font-weight: 700;
        margin: 0;
    }

    /* Original Sticker Grid */
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
