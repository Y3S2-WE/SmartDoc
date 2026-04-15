import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { APPOINTMENT_API_URL, PAYMENT_API_URL } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const LOCAL_STORAGE_KEY = 'smartdoc_pending_checkout';

function PaymentSuccessPage({ session }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [result, setResult] = useState(location.state?.result || null);
  const [showPopup, setShowPopup] = useState(Boolean(location.state?.result));
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const handledRef = useRef(false);

  useEffect(() => {
    // Already have result from SPA navigation (popup flow completed in CheckoutPage)
    if (result) return;

    // PayPal redirect flow: ?token=ORDER_ID&PayerID=PAYER_ID
    const orderId = searchParams.get('token');
    const payerId = searchParams.get('PayerID');

    if (!orderId || !payerId) return;

    // Guard against double-execution (React StrictMode double-invoke)
    if (handledRef.current) return;
    handledRef.current = true;

    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    let draft = null;
    if (raw) {
      try { draft = JSON.parse(raw); } catch { /* ignore */ }
    }

    if (!draft) {
      setError('Checkout session not found. Payment may have been processed. Please contact support with your PayPal Order ID: ' + orderId);
      return;
    }

    const completeBooking = async () => {
      setProcessing(true);
      try {
        const captureResponse = await axios.post(`${PAYMENT_API_URL}/api/payments/paypal/capture-order`, {
          orderId
        });

        const bookingResponse = await axios.post(`${APPOINTMENT_API_URL}/book`, draft, {
          headers: { Authorization: `Bearer ${session.token}` }
        });

        localStorage.removeItem(LOCAL_STORAGE_KEY);

        const newResult = {
          message: bookingResponse.data.message || 'Appointment booked successfully after payment.',
          appointment: bookingResponse.data.appointment || null,
          captureId: captureResponse.data.captureId || null,
          orderId
        };

        setResult(newResult);
        setShowPopup(true);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            'Payment was processed but booking failed. Please contact support with PayPal Order ID: ' + orderId
        );
      } finally {
        setProcessing(false);
      }
    };

    completeBooking();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          {processing ? (
            <div className="flex items-center gap-2 rounded-xl border border-lake/15 bg-white p-4 text-sm text-ink/80">
              <Loader2 size={16} className="animate-spin text-lake" />
              <span>Confirming payment and creating your appointment...</span>
            </div>
          ) : error ? (
            <div className="flex items-start gap-2 rounded-xl border border-ember/30 bg-ember/10 p-4 text-sm text-ember">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : result ? (
            <div className="space-y-3 rounded-xl border border-lake/15 bg-white p-4 text-sm text-ink/80">
              <p className="font-semibold text-lake">{result.message}</p>
              {result.orderId ? <p>PayPal Order ID: {result.orderId}</p> : null}
              {result.captureId ? <p>PayPal Capture ID: {result.captureId}</p> : null}
              {result.appointment?.appointmentNumber ? (
                <p className="font-semibold">Appointment Number: #{result.appointment.appointmentNumber}</p>
              ) : null}
              {result.appointment?.videoRoomLink ? (
                <p>
                  Video Room Link:{' '}
                  <a href={result.appointment.videoRoomLink} target="_blank" rel="noreferrer" className="font-semibold text-lake underline">
                    Join Call
                  </a>
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
