interface userInterface {
    id: string;
    username: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

interface conversionInterface {
    Id: string;
    Title: string;
    UserId: string;
    JobId: string;
    CreatedAt: string;
}

interface jobInterface {
    id: string;
    userId: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    pdf_url: string;
    output_url?: string;
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}

interface subscriptionDataInterface {
    Id: string;
	UserId: string;
	CustomerId: string;
	PlanId: string;
	Status: string;
	SubscriptionId: string;
}

interface getSubscriptionResponseInterface {
    userSubscription: subscriptionDataInterface | null;
    message: string;
}

interface SubscriptionRecord {
	Id: string
	UserId: string
	CustomerId: string
	PlanId: string
	Status: string
	SubscriptionId: string
}

interface TokenBalanceRecord {
	Id?: string
	UserId?: string
	Balance: number
	Onhold?: number
	UpdatedAt?: string
}

interface PlanMeta {
	name?: string | null
	description?: string | null
	price?: number | string | null
}
