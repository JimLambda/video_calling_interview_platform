import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";

const http = httpRouter();

http.route({
    path:'/clerk-webhook',
    method: 'POST',
    handler: httpAction(async (context, request) => {
        const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
        if (!webhookSecret) {
            throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
        }

        const svix_id = request.headers.get("svix-id");
        const svix_signature = request.headers.get("svix-signature");
        const svix_timestamp = request.headers.get("svix-timestamp");

        if (!svix_id || !svix_signature || !svix_timestamp) {
            return new Response("No svix headers found", { 
                status: 400,
            });
        }

        const payload = await request.json();
        const body = JSON.stringify(payload);

        const webhook = new Webhook(webhookSecret);
        let event: WebhookEvent;

        try {
            event = webhook.verify(body, {
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            }) as WebhookEvent;
        } catch (err) {
            console.error("Error verifying svix payload webhook", err);
            return new Response("Invalid svix payload", {
                status: 400,
            });
        }
    })
});