import { PageHeader } from "@/components/page-header";
import { MessageSquare, Trash2, Mail } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function ContactMessagesView() {
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['contact_messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const deleteMessage = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('contact_messages').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact_messages'] });
      toast.success("Message deleted successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete message: ${error.message}`);
    }
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="Contact Messages"
        description="View and manage messages submitted from the public landing page."
        icon={<MessageSquare className="size-6 text-primary" />}
      />

      <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center flex-col text-muted-foreground gap-4">
            <Loader2 className="size-8 animate-spin" />
            <p className="text-sm font-medium">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-12 flex justify-center items-center flex-col text-muted-foreground gap-4 text-center">
            <div className="grid size-16 place-items-center rounded-2xl bg-muted/50 border">
              <MessageSquare className="size-8 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">No Messages</p>
              <p className="text-sm">You haven't received any contact messages yet.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {messages.map((msg: any) => (
              <div key={msg.id} className="p-6 transition-colors hover:bg-muted/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-600">
                      <Mail className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base flex items-center gap-2">
                        {msg.name}
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </span>
                      </h3>
                      <a href={`mailto:${msg.email}`} className="text-sm font-medium text-blue-600 hover:underline">
                        {msg.email}
                      </a>
                      <p className="mt-3 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-red-600 hover:bg-red-50 -mt-1 -mr-2"
                    onClick={() => deleteMessage.mutate(msg.id)}
                    disabled={deleteMessage.isPending}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
