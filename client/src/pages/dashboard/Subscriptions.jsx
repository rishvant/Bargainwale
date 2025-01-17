import React from "react";
import { format } from "date-fns";

const Subscriptions = () => {
  // Example subscription data - replace with your actual data source
  const subscription = {
    plan: "Premium",
    status: "Active",
    startDate: new Date("2024-03-01"),
    nextBillingDate: new Date("2024-04-01"),
    amount: 2999,
    billingCycle: "Monthly",
    features: [
      "Unlimited access",
      "Priority support",
      "Advanced analytics",
      "Custom exports",
    ],
  };

  // Add available plans data
  const availablePlans = [
    {
      name: "Basic",
      price: 999,
      cycle: "Monthly",
      features: [
        "Basic access",
        "Email support",
        "Basic analytics",
        "Standard exports",
      ],
      recommended: false,
    },
    {
      name: "Premium",
      price: 2999,
      cycle: "Monthly",
      features: [
        "Unlimited access",
        "Priority support",
        "Advanced analytics",
        "Custom exports",
      ],
      recommended: true,
    },
    {
      name: "Enterprise",
      price: 9999,
      cycle: "Monthly",
      features: [
        "Unlimited access",
        "24/7 Priority support",
        "Advanced analytics",
        "Custom exports",
        "API access",
        "Custom integrations",
      ],
      recommended: false,
    },
  ];

  return (
    <div className="relative max-w-7xl mx-auto p-6 space-y-8 top-4">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Subscription</h1>
        <p className="mt-2 text-gray-600">
          Manage your subscription and billing details
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Subscription - Left Side */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Current Plan
                </h2>
                <p className="mt-2 text-xl font-semibold text-gray-900">
                  {subscription.plan}
                </p>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </h2>
                <span className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {subscription.status}
                </span>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </h2>
                <p className="mt-2 text-gray-900">
                  {format(subscription.startDate, "MMM dd, yyyy")}
                </p>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Next Billing
                </h2>
                <p className="mt-2 text-gray-900">
                  {format(subscription.nextBillingDate, "MMM dd, yyyy")}
                </p>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </h2>
                <p className="mt-2 text-gray-900">
                  <span className="text-xl font-semibold">
                    ₹{subscription.amount}
                  </span>
                  <span className="text-gray-500">
                    /{subscription.billingCycle.toLowerCase()}
                  </span>
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                Plan Features
              </h2>
              <ul className="grid grid-cols-1 gap-3">
                {subscription.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-700">
                    <svg
                      className="w-5 h-5 mr-3 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <button className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Manage Subscription
              </button>
            </div>
          </div>
        </div>

        {/* Available Plans - Right Side */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Available Plans
            </h2>
            <p className="mt-2 text-gray-600">
              Choose the plan that works best for you
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availablePlans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-xl shadow-lg p-6 border-2 flex flex-col h-full transition-all duration-200 hover:shadow-xl ${
                  plan.recommended ? "border-blue-500" : "border-transparent"
                }`}
              >
                <div className="flex-grow">
                  {plan.recommended && (
                    <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
                      RECOMMENDED
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-gray-900">
                      ₹{plan.price}
                    </span>
                    <span className="text-gray-500">
                      /{plan.cycle.toLowerCase()}
                    </span>
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-gray-700">
                        <svg
                          className="w-5 h-5 mr-3 text-green-500 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8">
                  <button
                    className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors duration-200 ${
                      plan.name === subscription.plan
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    }`}
                    disabled={plan.name === subscription.plan}
                  >
                    {plan.name === subscription.plan
                      ? "Current Plan"
                      : "Switch Plan"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;
