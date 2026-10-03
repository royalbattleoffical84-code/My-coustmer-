/**
 * VictoryX Backend - Node.js + Firebase Realtime Database
 * Automatic Notifications for:
 * - New Tournament Creation
 * - Tournament Status Changes (Live/Completed)
 * - User Deposits/Withdrawals
 * - Tournament Joins
 */

const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Firebase Admin SDK Initialization
const serviceAccount = {
    type: "service_account",
    project_id: "app-for-me-2304e",
    private_key_id: "ee3706ff422e94a1dd3439c8065b790ddf9f6318",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEugIBADANBgkqhkiG9w0BAQEFAASCBKQwggSgAgEAAoIBAQDV1QJ0vTGOJiY5\nT3ynQle5XPkLsx9Q5AsRMgmfLVzImsOUK5zcUhPn5FCp2u71zHc8d29CVz5CpDG3\ny2M3C2rmMNIwu0sSQYyUx1wMK1OTYNA8zV2s84cCKazPmPqZ39y9q+L2msj3heVf\nj8ZjcT4FzJwgD7ZvTOfdPvgfrgI6+nV64kwjInYQINhnVQgIi5XnnadjlGyKDB58\ne8KJXYHhW2YCG1yhsCPzp3DyUSsMoY23qToO0hes5+6UZTxgPWnuMUuy259aTluc\nGVJLhVXBI/f3CPoTtEmV9FKIvY6Ky6JoyLWsarV7qATxR10/O29DWUzSclAsyFub\nORMl1fUPAgMBAAECgf9jQf1h3cX4YL0IMrLU8SFyFIuGYsn77TSLRtmF314HwHoI\nzYstZOwt4vg5NZIMMbJ83vPxAjkPC34IqDXl1zxH82GePVJw/FHFaMUm4PW/87C1\n3fPIf0KsPlbOsV73uR0+Q2DswpeG+SBVZj0w6+AJJnFScKNpXB7vvyBuPtfKMp89\ntRaj5bszQm8WqmltbNXCEgtsAVhM0P/yVnV0y+ghm4sS6twbBrMLotjJZzieVip7\nCG80VmmpBq2WqquwPsYHuH0EgNG3XqrFLpn+g8tCBqG3qtQnH+fR3tXR9CIn55Y4\ngymh/h72TdW1wl5wXBaxqSwYLMDtsadMFBX9/Y0CgYEA9J+yl8cQc3lHBvTE5D5j\njkXIuIG7VEM6eAbnAB/V54/EkaNLH6LDbJ6Xc6bvkw7Wr/W7FxK7EEGqpU3f5GTU\nVdt4Bp2xtYWpdpQ7t93oJO1Hzqw0DzwmpLleAoiy0I7wC7oP6mEEk1+BwKBeqjyy\n1ap5v1L5x4lvRw0qGuNFgoUCgYEA38a6qeqkazhxC/C7lWghAGpiGrPIXOoyTkkM\n4nPARKmGS+aeHVmmZ3g+idkGYQKx1pyFHoYYkl/ht/lNIhQBwUIhWnijQ3p5s4oq\nWzclucE39LTTBcyF+m8zmY2aGgXUPnIwP6wBxZLL3Zk70/lsiPcfwEqpVRJn+8zA\nOz/i74MCgYAHNDTEN36KiAXJdKffuN6hr/hrRpbHsnskUb+3xzg7a4Z0a4So19g9\neKYpJ79ia0tzPx9VXJ3ZqrVlzNdNGJMQPDhaqYY0PE1zSoY/se9GNx6oPXYDBNh2\nfWcBWBk7/xmensodMuI5nNRrYc2n4cW6eRzAv6bPc4KtavvUcuD3KQKBgFfoCJIR\nVA+ut3H6WqZBpp00LV/R+kbN1X89YStgT0pp0hDlAn4DJsSEzwR11fSsC1KEYCLy\niJqPwer0q2FUvK+/m7yfoXszlLV79FGq404KYkHl+vPPOV586qdKohvQ6GSzlNKe\nbn+/wAhIVuFZnVJcygNPESATP/gBog5kdXCjAoGAX28b44Uq7vBQQ+k261s1CaPF\n0xM1dBOCPC3DVDWKwjlQfdK9sC56xRRHONaDfH/oiHqCaibtN7Q92jkhc4uP4EP3\nJz6i46fgNwL7fNG1IopkwSOYfX7fQrW1flz4fDtRNsm+xvk5mFWNsuh+mVGl06Pu\nqiI8UyOXdZCEo6pIIeM=\n-----END PRIVATE KEY-----\n",
",
    client_email: "firebase-adminsdk@app-for-me-2304e.iam.gserviceaccount.com",
    client_id: "106922198899389740957",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40app-for-me-2304e.iam.gserviceaccount.c"
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://app-for-me-2304e-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.firestore();
const rtdb = admin.database();
const Timestamp = admin.firestore.Timestamp;

// =====================================================================
// NOTIFICATION SERVICE
// =====================================================================

class NotificationService {
    static async sendToUser(userId, notification) {
        try {
            const notificationData = {
                ...notification,
                timestamp: Date.now(),
                read: false,
                userId: userId
            };

            // Push to Realtime Database (for real-time alerts)
            await rtdb.ref(`notifications/${userId}/${Date.now()}`).set(notificationData);

            // Also store in Firestore for persistence
            await db.collection('notifications').add(notificationData);

            console.log(`📨 Notification sent to ${userId}: ${notification.title}`);
            return true;
        } catch (error) {
            console.error('Error sending notification:', error);
            return false;
        }
    }

    static async sendToAll(notification) {
        try {
            const usersSnap = await db.collection('users').get();
            let sentCount = 0;

            for (const userDoc of usersSnap.docs) {
                await this.sendToUser(userDoc.id, notification);
                sentCount++;
            }

            console.log(`📢 Broadcast notification sent to ${sentCount} users`);
            return sentCount;
        } catch (error) {
            console.error('Error sending broadcast notification:', error);
            return 0;
        }
    }

    static async sendToActiveUsers(notification) {
        try {
            const usersSnap = await db.collection('users')
                .where('lastActive', '>', Timestamp.now().toMillis() - 24 * 60 * 60 * 1000)
                .get();

            let sentCount = 0;
            for (const userDoc of usersSnap.docs) {
                await this.sendToUser(userDoc.id, notification);
                sentCount++;
            }

            console.log(`📢 Active users notification sent to ${sentCount} users`);
            return sentCount;
        } catch (error) {
            console.error('Error sending active users notification:', error);
            return 0;
        }
    }
}

// =====================================================================
// TOURNAMENT ENDPOINTS
// =====================================================================

// Create Tournament - Sends notification to all users
app.post('/api/tournaments/create', async (req, res) => {
    try {
        const { name, prize, description, createdBy } = req.body;

        if (!name || !prize) {
            return res.status(400).json({ error: 'Name and prize are required' });
        }

        const tournamentData = {
            name,
            prize: parseFloat(prize),
            description: description || '',
            status: 'upcoming',
            players: 0,
            createdBy,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        const docRef = await db.collection('tournaments').add(tournamentData);

        // 🔔 SEND NOTIFICATION - New Tournament Created
        await NotificationService.sendToAll({
            type: 'tournament_created',
            title: '🏆 New Tournament Created!',
            message: `${name} tournament is now live with ₹${prize} prize pool!`,
            tournamentId: docRef.id,
            icon: '🏆'
        });

        res.json({
            success: true,
            tournamentId: docRef.id,
            message: 'Tournament created and notifications sent!'
        });
    } catch (error) {
        console.error('Error creating tournament:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update Tournament Status - Sends notification when tournament goes live/completes
app.post('/api/tournaments/:id/update-status', async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const { status } = req.body;

        const validStatuses = ['upcoming', 'live', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const tournamentRef = db.collection('tournaments').doc(req.params.id);
        const tournamentSnap = await tournamentRef.get();

        if (!tournamentSnap.exists) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        const tournament = tournamentSnap.data();
        await tournamentRef.update({
            status: status,
            updatedAt: Timestamp.now()
        });

        // 🔔 SEND NOTIFICATIONS based on status
        if (status === 'live') {
            await NotificationService.sendToAll({
                type: 'tournament_live',
                title: '⚡ Tournament is LIVE Now!',
                message: `${tournament.name} has started! Join now to compete for ₹${tournament.prize}!`,
                tournamentId: req.params.id,
                icon: '⚡'
            });
        } else if (status === 'completed') {
            await NotificationService.sendToAll({
                type: 'tournament_completed',
                title: '✅ Tournament Completed!',
                message: `${tournament.name} has concluded. Check results and prizes!`,
                tournamentId: req.params.id,
                icon: '✅'
            });
        } else if (status === 'cancelled') {
            await NotificationService.sendToAll({
                type: 'tournament_cancelled',
                title: '❌ Tournament Cancelled',
                message: `${tournament.name} has been cancelled. Refunds will be processed.`,
                tournamentId: req.params.id,
                icon: '❌'
            });
        }

        res.json({
            success: true,
            message: `Tournament status updated to ${status} and notifications sent!`
        });
    } catch (error) {
        console.error('Error updating tournament:', error);
        res.status(500).json({ error: error.message });
    }
});

// =====================================================================
// DEPOSIT ENDPOINTS
// =====================================================================

// Create Deposit - Sends notification to user
app.post('/api/deposits/create', async (req, res) => {
    try {
        const { userId, amount } = req.body;

        if (!userId || !amount || amount < 10) {
            return res.status(400).json({ error: 'Invalid deposit amount (minimum ₹10)' });
        }

        const depositData = {
            userId,
            amount: parseFloat(amount),
            status: 'pending',
            createdAt: Timestamp.now(),
            method: 'online'
        };

        const docRef = await db.collection('deposits').add(depositData);

        // 🔔 SEND NOTIFICATION - Deposit Initiated
        await NotificationService.sendToUser(userId, {
            type: 'deposit_initiated',
            title: '💰 Deposit Initiated',
            message: `Your deposit of ₹${amount} has been initiated. Waiting for confirmation.`,
            amount: amount,
            icon: '💰'
        });

        res.json({
            success: true,
            depositId: docRef.id,
            message: 'Deposit created and notification sent!'
        });
    } catch (error) {
        console.error('Error creating deposit:', error);
        res.status(500).json({ error: error.message });
    }
});

// Approve Deposit - Sends confirmation notification
app.post('/api/deposits/:id/approve', async (req, res) => {
    try {
        const depositRef = db.collection('deposits').doc(req.params.id);
        const depositSnap = await depositRef.get();

        if (!depositSnap.exists) {
            return res.status(404).json({ error: 'Deposit not found' });
        }

        const deposit = depositSnap.data();
        await depositRef.update({
            status: 'completed',
            approvedAt: Timestamp.now()
        });

        // Update user balance
        const userRef = db.collection('users').doc(deposit.userId);
        const userSnap = await userRef.get();
        const currentBalance = userSnap.data().balance || 0;
        await userRef.update({
            balance: currentBalance + deposit.amount
        });

        // 🔔 SEND NOTIFICATION - Deposit Successful
        await NotificationService.sendToUser(deposit.userId, {
            type: 'deposit_completed',
            title: '✅ Deposit Successful!',
            message: `₹${deposit.amount} has been added to your wallet!`,
            amount: deposit.amount,
            newBalance: currentBalance + deposit.amount,
            icon: '✅'
        });

        res.json({
            success: true,
            message: 'Deposit approved and balance updated!'
        });
    } catch (error) {
        console.error('Error approving deposit:', error);
        res.status(500).json({ error: error.message });
    }
});

// =====================================================================
// WITHDRAWAL ENDPOINTS
// =====================================================================

// Create Withdrawal - Sends notification to user
app.post('/api/withdrawals/create', async (req, res) => {
    try {
        const { userId, amount } = req.body;

        if (!userId || !amount || amount < 10) {
            return res.status(400).json({ error: 'Invalid withdrawal amount (minimum ₹10)' });
        }

        // Check user balance
        const userSnap = await db.collection('users').doc(userId).get();
        const userBalance = userSnap.data().balance || 0;

        if (userBalance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        const withdrawalData = {
            userId,
            amount: parseFloat(amount),
            status: 'pending',
            createdAt: Timestamp.now(),
            bankDetails: req.body.bankDetails || 'Not provided'
        };

        const docRef = await db.collection('withdrawals').add(withdrawalData);

        // Deduct from user balance immediately
        await db.collection('users').doc(userId).update({
            balance: userBalance - amount
        });

        // 🔔 SEND NOTIFICATION - Withdrawal Initiated
        await NotificationService.sendToUser(userId, {
            type: 'withdrawal_initiated',
            title: '💸 Withdrawal Initiated',
            message: `Your withdrawal request for ₹${amount} is being processed.`,
            amount: amount,
            icon: '💸'
        });

        res.json({
            success: true,
            withdrawalId: docRef.id,
            message: 'Withdrawal initiated and notification sent!'
        });
    } catch (error) {
        console.error('Error creating withdrawal:', error);
        res.status(500).json({ error: error.message });
    }
});

// Approve Withdrawal - Sends confirmation notification
app.post('/api/withdrawals/:id/approve', async (req, res) => {
    try {
        const withdrawalRef = db.collection('withdrawals').doc(req.params.id);
        const withdrawalSnap = await withdrawalRef.get();

        if (!withdrawalSnap.exists) {
            return res.status(404).json({ error: 'Withdrawal not found' });
        }

        const withdrawal = withdrawalSnap.data();
        await withdrawalRef.update({
            status: 'completed',
            approvedAt: Timestamp.now()
        });

        // 🔔 SEND NOTIFICATION - Withdrawal Successful
        await NotificationService.sendToUser(withdrawal.userId, {
            type: 'withdrawal_completed',
            title: '✅ Withdrawal Successful!',
            message: `₹${withdrawal.amount} has been transferred to your bank account.`,
            amount: withdrawal.amount,
            icon: '✅'
        });

        res.json({
            success: true,
            message: 'Withdrawal approved and notification sent!'
        });
    } catch (error) {
        console.error('Error approving withdrawal:', error);
        res.status(500).json({ error: error.message });
    }
});

// Reject Withdrawal - Sends rejection notification and refunds balance
app.post('/api/withdrawals/:id/reject', async (req, res) => {
    try {
        const withdrawalRef = db.collection('withdrawals').doc(req.params.id);
        const withdrawalSnap = await withdrawalRef.get();

        if (!withdrawalSnap.exists) {
            return res.status(404).json({ error: 'Withdrawal not found' });
        }

        const withdrawal = withdrawalSnap.data();
        await withdrawalRef.update({
            status: 'rejected',
            rejectedAt: Timestamp.now()
        });

        // Refund balance
        const userSnap = await db.collection('users').doc(withdrawal.userId).get();
        const currentBalance = userSnap.data().balance || 0;
        await db.collection('users').doc(withdrawal.userId).update({
            balance: currentBalance + withdrawal.amount
        });

        // 🔔 SEND NOTIFICATION - Withdrawal Rejected
        await NotificationService.sendToUser(withdrawal.userId, {
            type: 'withdrawal_rejected',
            title: '❌ Withdrawal Rejected',
            message: `Your withdrawal request for ₹${withdrawal.amount} was rejected. Amount refunded to your wallet.`,
            amount: withdrawal.amount,
            refundedBalance: currentBalance + withdrawal.amount,
            icon: '❌'
        });

        res.json({
            success: true,
            message: 'Withdrawal rejected and balance refunded!'
        });
    } catch (error) {
        console.error('Error rejecting withdrawal:', error);
        res.status(500).json({ error: error.message });
    }
});

// =====================================================================
// TOURNAMENT JOIN ENDPOINT
// =====================================================================

// User Joins Tournament
app.post('/api/tournaments/:id/join', async (req, res) => {
    try {
        const { userId } = req.body;
        const tournamentId = req.params.id;

        const tournamentRef = db.collection('tournaments').doc(tournamentId);
        const tournamentSnap = await tournamentRef.get();

        if (!tournamentSnap.exists) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        const tournament = tournamentSnap.data();

        // Add player to tournament
        await tournamentRef.update({
            players: (tournament.players || 0) + 1
        });

        // Add entry record
        await db.collection('tournament_entries').add({
            userId,
            tournamentId,
            joinedAt: Timestamp.now()
        });

        // 🔔 SEND NOTIFICATION - Tournament Joined
        await NotificationService.sendToUser(userId, {
            type: 'tournament_joined',
            title: '🎮 Tournament Joined!',
            message: `You've joined ${tournament.name}! Total prize: ₹${tournament.prize}`,
            tournamentName: tournament.name,
            prize: tournament.prize,
            icon: '🎮'
        });

        // Also notify if tournament is live
        if (tournament.status === 'live') {
            await NotificationService.sendToUser(userId, {
                type: 'tournament_live_reminder',
                title: '⚡ Tournament is LIVE!',
                message: `Get ready! ${tournament.name} has started!`,
                tournamentName: tournament.name,
                icon: '⚡'
            });
        }

        res.json({
            success: true,
            message: 'Successfully joined tournament and notifications sent!'
        });
    } catch (error) {
        console.error('Error joining tournament:', error);
        res.status(500).json({ error: error.message });
    }
});

// =====================================================================
// HEALTH CHECK & STATUS
// =====================================================================

app.get('/api/health', (req, res) => {
    res.json({
        status: 'VictoryX Backend is running ✅',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/stats', async (req, res) => {
    try {
        const usersSnap = await db.collection('users').get();
        const tournamentsSnap = await db.collection('tournaments').get();
        const depositsSnap = await db.collection('deposits').get();
        const withdrawalsSnap = await db.collection('withdrawals').get();

        res.json({
            totalUsers: usersSnap.size,
            totalTournaments: tournamentsSnap.size,
            totalDeposits: depositsSnap.size,
            totalWithdrawals: withdrawalsSnap.size,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================================
// ADMIN NOTIFICATION SEND
// =====================================================================

app.post('/api/admin/send-notification', async (req, res) => {
    try {
        const { title, message, target } = req.body;

        if (!title || !message || !target) {
            return res.status(400).json({ error: 'Title, message, and target are required' });
        }

        const notification = { title, message, type: 'admin_notification' };

        let sentCount;
        if (target === 'all') {
            sentCount = await NotificationService.sendToAll(notification);
        } else if (target === 'active') {
            sentCount = await NotificationService.sendToActiveUsers(notification);
        } else {
            return res.status(400).json({ error: 'Invalid target' });
        }

        res.json({
            success: true,
            sentCount,
            message: `Notification sent to ${sentCount} users!`
        });
    } catch (error) {
        console.error('Error sending admin notification:', error);
        res.status(500).json({ error: error.message });
    }
});

// =====================================================================
// SERVER STARTUP
// =====================================================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║          🎮 VictoryX Backend Server Started 🎮             ║
║════════════════════════════════════════════════════════════║
║ ✅ Server running on: http://localhost:${PORT}              ║
║ ✅ Firebase Realtime Database: Connected                  ║
║ ✅ Firestore: Connected                                    ║
║ ✅ Notification Service: Active                            ║
║                                                            ║
║ Endpoints:                                                 ║
║ POST /api/tournaments/create                               ║
║ POST /api/tournaments/:id/update-status                    ║
║ POST /api/deposits/create                                  ║
║ POST /api/deposits/:id/approve                             ║
║ POST /api/withdrawals/create                               ║
║ POST /api/withdrawals/:id/approve                          ║
║ POST /api/tournaments/:id/join                             ║
║ GET  /api/health                                           ║
║ GET  /api/stats                                            ║
║════════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
