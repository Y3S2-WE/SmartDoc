import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, CalendarCheck2, CreditCard, FileText, Hospital, ShieldCheck, Stethoscope, Video } from 'lucide-react';

import { APPOINTMENT_API_URL, PAYMENT_API_URL } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const LKR_TO_USD_RATE = Number(import.meta.env.VITE_LKR_TO_USD_RATE || 0.0033);
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';
const LOCAL_STORAGE_KEY = 'smartdoc_pending_checkout';

const parseDraft = (locationState) => {
  if (locationState?.checkoutDraft) {
    return locationState.checkoutDraft;
  }

  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return null;
  }
};

function CheckoutPage({ session }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [feedback, setFeedback] = useState('');
  const paypalButtonsRef = useRef(null);
  const paypalRenderedRef = useRef(false);

  const draft = useMemo(() => parseDraft(location.state), [location.state]);

  const breakdown = useMemo(() => {
    if (!draft) {
      return null;
    }

    const consultationFeeLkr = Number(draft.channellingFee || 0);
    const platformFeeLkr = Number((consultationFeeLkr * 0.03).toFixed(2));
    const secureTransactionFeeLkr = 150;
    const subtotalLkr = consultationFeeLkr + platformFeeLkr + secureTransactionFeeLkr;
    const taxLkr = Number((subtotalLkr * 0.02).toFixed(2));
    const totalLkr = Number((subtotalLkr + taxLkr).toFixed(2));
    const totalUsd = Number((totalLkr * LKR_TO_USD_RATE).toFixed(2));

    return {
      consultationFeeLkr,
      platformFeeLkr,
      secureTransactionFeeLkr,
      taxLkr,
      totalLkr,
      totalUsd,
      lkrToUsdRate: LKR_TO_USD_RATE
    };
  }, [draft]);

  useEffect(() => {
    if (!PAYPAL_CLIENT_ID) {
      setFeedback('PayPal client ID is missing. Set VITE_PAYPAL_CLIENT_ID in frontend env.');
      return;
    }

    if (window.paypal) {
      setSdkReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture&components=buttons,funding-eligibility`;
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => setFeedback('Unable to load PayPal SDK. Please refresh and try again.');

    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!acceptedTerms || !sdkReady || !window.paypal || !paypalButtonsRef.current || paypalRenderedRef.current || !draft || !breakdown) {
      return;
    }

    setFeedback('');

    const buttons = window.paypal.Buttons({
      style: {
        layout: 'vertical',
        shape: 'rect',
        label: 'paypal'
      },
      createOrder: async () => {
        const response = await axios.post(`${PAYMENT_API_URL}/api/payments/paypal/create-order`, {
          appointmentDraft: draft,
          amountBreakdown: breakdown
        });

        return response.data.orderId;
      },
      onApprove: async (data) => {
        try {
          setPaymentLoading(true);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draft));

          const captureResponse = await axios.post(`${PAYMENT_API_URL}/api/payments/paypal/capture-order`, {
            orderId: data.orderID
          });

          const bookingResponse = await axios.post(`${APPOINTMENT_API_URL}/book`, draft, {
            headers: { Authorization: `Bearer ${session.token}` }
          });

          localStorage.removeItem(LOCAL_STORAGE_KEY);

          navigate('/payment/success', {
            state: {
              result: {
                message: bookingResponse.data.message || 'Appointment booked successfully after payment.',
                appointment: bookingResponse.data.appointment || null,
                captureId: captureResponse.data.captureId || null,
                orderId: data.orderID
              }
            }
          });
        } catch (error) {
          setPaymentLoading(false);
          setFeedback(error.response?.data?.message || 'Payment was processed but booking failed. Please contact support.');
        }
      },
      onCancel: () => {
        navigate('/payment/cancel');
      },
      onError: (error) => {
        setFeedback(error?.message || 'PayPal checkout failed. Please try again.');
      }
    });

    buttons.render(paypalButtonsRef.current);
    paypalRenderedRef.current = true;
  }, [acceptedTerms, sdkReady, draft, breakdown, navigate, location.state]);

  if (!draft || !breakdown) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
        <Card className="portal-shell bg-white/65">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lake">
              <AlertTriangle size={18} /> Checkout Session Not Found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-ink/75">
              Your checkout details are missing. Please go back and complete the appointment form again.
            </p>
            <Button onClick={() => navigate('/appointments')}>Back to Appointment Form</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      {feedback ? (
        <p className="mb-4 rounded-xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm font-medium text-ember">
          {feedback}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="portal-shell overflow-hidden bg-gradient-to-br from-lake/95 via-lake to-teal-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CalendarCheck2 size={18} /> Appointment Checkout
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/80">Doctor Details</p>
              <p className="text-lg font-bold">Dr. {draft.doctorName}</p>
              <p className="text-sm text-white/90">{draft.specialization || 'General Medicine'}</p>
              <p className="mt-1 flex items-center gap-1 text-sm text-white/85">
                <Hospital size={14} /> {draft.hospitalOrClinicName || 'Hospital / Clinic not provided'}
              </p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/80">Appointment Summary</p>
              <div className="space-y-1 text-sm">
                <p>
                  {draft.appointmentType === 'video' ? <Video size={14} className="mr-1 inline" /> : <Stethoscope size={14} className="mr-1 inline" />}
                  {draft.appointmentType === 'video' ? 'Video Consultation' : 'Physical Consultation'}
                </p>
                <p>Date: {draft.appointmentDate}</p>
                <p>Time: {draft.appointmentTimeSlot}</p>
                <p>Patient: {draft.patientName}</p>
                <p>Contact: {draft.patientEmail} | {draft.patientPhoneNumber}</p>
                <p>Address: {draft.patientAddress}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/80">Terms and Conditions</p>
              <ul className="list-disc space-y-1 pl-5 text-xs text-white/90">
                <li>Appointment booking is confirmed only after successful payment capture.</li>
                <li>Rescheduling and cancellation policies depend on your selected doctor or clinic.</li>
                <li>For video appointments, your secure room link appears after payment success.</li>
              </ul>

              <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm font-medium text-white">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/50 bg-white/80"
                />
                I Accept the Terms and Conditions
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className="portal-shell bg-white/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lake">
              <CreditCard size={18} /> Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-lake/10 bg-white p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-lake">
                <FileText size={15} /> Detailed Breakdown
              </p>

              <div className="space-y-2 text-sm text-ink/80">
                <LineItem label="Consultation / Channelling Fee" value={`LKR ${breakdown.consultationFeeLkr.toFixed(2)}`} />
                <LineItem label="Platform Service Fee (3%)" value={`LKR ${breakdown.platformFeeLkr.toFixed(2)}`} />
                <LineItem label="Secure Transaction Fee" value={`LKR ${breakdown.secureTransactionFeeLkr.toFixed(2)}`} />
                <LineItem label="Tax (2%)" value={`LKR ${breakdown.taxLkr.toFixed(2)}`} />
              </div>

              <div className="mt-4 border-t border-lake/10 pt-3">
                <LineItem label="Total in LKR" value={`LKR ${breakdown.totalLkr.toFixed(2)}`} emphasize />
                <LineItem label={`Converted USD (rate ${breakdown.lkrToUsdRate})`} value={`USD ${breakdown.totalUsd.toFixed(2)}`} emphasize />
              </div>
            </div>

            <div className="rounded-2xl border border-mint/40 bg-mint/25 px-3 py-2 text-xs font-medium text-lake">
              <ShieldCheck size={14} className="mr-1 inline" /> Official PayPal checkout methods will open in a secure popup window.
            </div>

            <div className="rounded-2xl border border-lake/15 bg-white p-3">
              {!acceptedTerms ? (
                <p className="text-sm font-medium text-ink/70">Accept Terms & Conditions to enable PayPal payment methods.</p>
              ) : null}
              <div ref={paypalButtonsRef} className="mt-2" />
            </div>

            {paymentLoading ? <p className="text-xs font-semibold text-lake">Confirming payment and creating appointment...</p> : null}

            <Button variant="outline" className="w-full" onClick={() => navigate('/appointments')}>
              Back to Appointment Form
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LineItem({ label, value, emphasize = false }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={emphasize ? 'font-semibold text-lake' : ''}>{label}</span>
      <span className={emphasize ? 'text-base font-bold text-lake' : 'font-semibold'}>{value}</span>
    </div>
  );
}

export default CheckoutPage;
