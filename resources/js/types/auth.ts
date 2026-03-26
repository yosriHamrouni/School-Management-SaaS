export type UserRole = {
    id: number;
    name: string;
    description?: string | null;
};

export type UserEstablishment = {
    id: number;
    name: string;
    email?: string | null;
};

export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    establishment?: UserEstablishment | null;
    roles?: UserRole[];
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
