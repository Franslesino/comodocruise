import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Check Booking - KOMODOCRUISES",
    description: "Check your booking status and details.",
};

export default function CheckBookingPage() {
    return (
        <div className="min-h-screen bg-gray-50 pt-24">
            <div className="max-w-2xl mx-auto px-6">
                <h1 className="font-canto text-4xl text-neutral-900 mb-8 text-center">Check Your Booking</h1>
                
                <div className="bg-white rounded-2xl shadow-sm p-8">
                    <form className="space-y-6">
                        <div>
                            <label className="block font-avenir text-sm font-medium text-neutral-700 mb-2">
                                Booking Reference
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your booking reference"
                                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent font-avenir"
                            />
                        </div>
                        
                        <div>
                            <label className="block font-avenir text-sm font-medium text-neutral-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent font-avenir"
                            />
                        </div>
                        
                        <button
                            type="submit"
                            className="w-full bg-sky-500 text-white py-3 rounded-lg font-avenir font-semibold hover:bg-sky-600 transition-colors"
                        >
                            Find Booking
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
