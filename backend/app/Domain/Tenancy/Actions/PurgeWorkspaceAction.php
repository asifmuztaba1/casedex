<?php

namespace App\Domain\Tenancy\Actions;

use App\Domain\Tenancy\Models\Tenant;
use Illuminate\Support\Facades\DB;

/**
 * Deletes a workspace's content when its last member's account is erased.
 *
 * Deleted: everything about cases and clients (cases, hearings, diary,
 * documents, contacts, parties, notes, AI requests, notifications, support
 * tickets, exports).
 *
 * Kept: accounting records (payments, plan changes, AI credit ledger and
 * wallet, Lemon Squeezy rows) and the audit log, whose metadata is cleared
 * because it can quote case details. The tenant row stays as a soft-deleted
 * "Deleted workspace" tombstone so those records keep their parent.
 *
 * Runs inside the caller's transaction. Returns storage paths to delete once
 * that transaction commits.
 */
class PurgeWorkspaceAction
{
    /** Tenant tables emptied, children before parents (foreign keys restrict deletes). */
    public const DELETED_TABLES = [
        'workspace_exports',
        'voice_sessions',
        'case_notifications',
        'documents',
        'diary_entries',
        'hearing_summaries',
        'ai_requests',
        'hearings',
        'case_parties',
        'case_participants',
        'cases',
        'clients',
        'research_notes',
        'ai_alert_rules',
        'judiciary_causelist_logs',
        'push_subscriptions',
        'feedback',
        'support_tickets', // support_messages cascade
    ];

    /** Tenant tables deliberately kept (accounting and audit history). */
    public const KEPT_TABLES = [
        'audit_logs',
        'ai_credit_ledgers',
        'ai_credit_wallets',
        'ai_manual_payment_requests',
        'manual_payment_requests',
        'manual_subscription_change_requests',
        'users',
    ];

    /**
     * @return array<int, string> storage paths to delete after commit
     */
    public function handle(Tenant $tenant): array
    {
        $tenantId = $tenant->id;

        $files = array_merge(
            DB::table('documents')->where('tenant_id', $tenantId)->whereNotNull('storage_key')->pluck('storage_key')->all(),
            DB::table('workspace_exports')->where('tenant_id', $tenantId)->whereNotNull('path')->pluck('path')->all(),
            DB::table('support_messages')
                ->whereIn('ticket_id', DB::table('support_tickets')->where('tenant_id', $tenantId)->select('id'))
                ->whereNotNull('attachment_path')
                ->pluck('attachment_path')
                ->all(),
        );

        DB::table('support_messages')
            ->whereIn('ticket_id', DB::table('support_tickets')->where('tenant_id', $tenantId)->select('id'))
            ->delete();

        foreach (self::DELETED_TABLES as $table) {
            DB::table($table)->where('tenant_id', $tenantId)->delete();
        }

        DB::table('audit_logs')->where('tenant_id', $tenantId)->update(['metadata' => null]);

        $tenant->forceFill(['name' => 'Deleted workspace'])->save();
        $tenant->delete();

        return $files;
    }
}
