import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

function PaymentSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPopup, setShowPopup] = useState(Boolean(location.state?.result));

  const result = location.state?.result || null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
      <Card className="portal-shell bg-white/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lake">
            <CheckCircle2 size={18} />
            Payment Success
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result ? (
            <div className="space-y-3 rounded-xl border border-lake/15 bg-white p-4 text-sm text-ink/80">
              <p className="font-semibold text-lake">{result.message}</p>
              {result.orderId ? <p>PayPal Order ID: {result.orderId}</p> : null}
              {result.captureId ? <p>PayPal Capture ID: {result.captureId}</p> : null}
              {result.appointment?.appointmentNumber ? (
                <p className="font-semibold">Appointment Number: #{result.appointment.appointmentNumber}</p>
              ) : null}
              {result.appointment?.videoRoomLink ? (
                <p>
                  Video Room Link: <a href={result.appointment.videoRoomLink} target="_blank" rel="noreferrer" className="font-semibold text-lake underline">Join Call</a>
                </p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-lake/15 bg-white p-4 text-sm text-ink/80">
              <p className="font-semibold text-lake">Payment completed.</p>
              <p>Confirmation details were not attached to this page load. Please check your patient dashboard.</p>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => navigate('/dashboard/patient')}>Go to Patient Dashboard</Button>
            <Button variant="outline" onClick={() => navigate('/appointments')}>Book Another Appointment</Button>
          </div>
        </CardContent>
      </Card>

      {showPopup && result ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/40 bg-white p-6 text-center shadow-panel">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-mint/35">
              <CheckCircle2 size={34} className="text-lake" />
            </div>
            <h3 className="text-2xl font-bold text-lake">Appointment Confirmed</h3>
            <p className="mt-2 text-sm text-ink/75">
              Your payment was successful and appointment booking is complete.
            </p>
            {result?.appointment?.appointmentNumber ? (
              <p className="mt-3 rounded-xl bg-lake/10 px-3 py-2 text-sm font-semibold text-lake">
                Booking No: #{result.appointment.appointmentNumber}
              </p>
            ) : null}
            <Button className="mt-4 w-full" onClick={() => setShowPopup(false)}>
              Continue
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default PaymentSuccessPage;
