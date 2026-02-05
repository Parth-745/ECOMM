/**
 * Weekly Delivery Scheduler
 *
 * IMPORTANT: This module uses setInterval instead of node-cron for demo purposes.
 * For production use, install node-cron: npm install node-cron
 * Then uncomment the cron import and update the start() method accordingly.
 */

// const cron = require('node-cron'); // Requires: npm install node-cron
const WeeklySchedule = require('../models/WeeklySchedule');
const { sendWeeklyDeliveryReminder } = require('./weeklyDeliveryMailer');

class WeeklyDeliveryScheduler {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
    }

    // Start the scheduler - runs every hour
    // Note: This uses setInterval instead of node-cron for demo purposes
    // For production, install node-cron: npm install node-cron
    start() {
        if (this.isRunning) {
            console.log('Weekly delivery scheduler is already running');
            return;
        }

        console.log('Starting weekly delivery scheduler...');

        // Run immediately, then every hour (3,600,000 milliseconds)
        this.checkAndSendReminders(); // Run immediately for testing
        this.intervalId = setInterval(async () => {
            try {
                await this.checkAndSendReminders();
            } catch (error) {
                console.error('Error in weekly delivery scheduler:', error);
            }
        }, 60 * 60 * 1000); // 1 hour

        this.isRunning = true;
        console.log('Weekly delivery scheduler started successfully (using setInterval)');
    }

    // Stop the scheduler
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('Weekly delivery scheduler stopped');
    }

    // Check for schedules that need reminders (exactly 1 hour away)
    async checkAndSendReminders() {
        try {
            console.log('Checking for weekly delivery reminders...');

            // Calculate time exactly 1 hour from now
            const now = new Date();
            const oneHourFromNow = new Date(now.getTime() + (60 * 60 * 1000)); // Add 1 hour

            // Find schedules where nextDeliveryDate is exactly 1 hour from now
            // We'll check within a 5-minute window to account for cron timing
            const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
            const startTime = new Date(oneHourFromNow.getTime() - fiveMinutes);
            const endTime = new Date(oneHourFromNow.getTime() + fiveMinutes);

            const schedulesToRemind = await WeeklySchedule.find({
                isActive: true,
                nextDeliveryDate: {
                    $gte: startTime,
                    $lte: endTime
                }
            })
            .populate('userId', 'email username')
            .populate('weeklyItems.productId', 'name price');

            console.log(`Found ${schedulesToRemind.length} schedules to send reminders for`);

            // Send reminders for each schedule
            for (const schedule of schedulesToRemind) {
                await this.sendReminderEmail(schedule);
            }

        } catch (error) {
            console.error('Error checking weekly delivery reminders:', error);
        }
    }

    // Send reminder email for a specific schedule
    async sendReminderEmail(schedule) {
        try {
            const user = schedule.userId;
            if (!user || !user.email) {
                console.error(`No email found for user in schedule ${schedule._id}`);
                return;
            }

            // Format delivery date and time
            const deliveryDate = schedule.nextDeliveryDate.toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const deliveryTime = schedule.deliveryTimeSlot;

            // Generate confirmation URLs
            const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const scheduleId = schedule._id;

            // Create confirmation and cancellation URLs
            const confirmUrl = `${baseUrl}/weekly-delivery/confirm/${scheduleId}`;
            const cancelUrl = `${baseUrl}/weekly-delivery/cancel/${scheduleId}`;

            // Send the email
            const emailResult = await sendWeeklyDeliveryReminder(
                user.email,
                deliveryDate,
                deliveryTime,
                schedule.weeklyItems,
                confirmUrl,
                cancelUrl
            );

            if (emailResult.success) {
                console.log(`Weekly delivery reminder sent to ${user.email} for schedule ${schedule._id}`);
            } else {
                console.error(`Failed to send reminder to ${user.email}:`, emailResult.error);
            }

        } catch (error) {
            console.error(`Error sending reminder for schedule ${schedule._id}:`, error);
        }
    }

    // Manual trigger for testing (optional)
    async triggerManualCheck() {
        console.log('Manually triggering weekly delivery check...');
        await this.checkAndSendReminders();
    }
}

module.exports = new WeeklyDeliveryScheduler();