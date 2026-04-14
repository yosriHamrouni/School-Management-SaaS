export type ConversationSummary = {
    participant: {
        id: number;
        name: string;
        roles: string[];
    };
    last_message: {
        id: number;
        content: string;
        created_at: string | null;
        sender_id: number;
        read_at: string | null;
    };
    unread_count: number;
};

export type ConversationMessage = {
    id: number;
    content: string;
    created_at: string | null;
    read_at: string | null;
    sender: {
        id: number;
        name: string;
    };
    receiver: {
        id: number;
        name: string;
    };
};

export type RecipientOption = {
    id: number;
    name: string;
    roles: string[];
};
