import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

function PaymentCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
      <Card className="portal-shell bg-white/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-ember">
            <AlertCircle size={18} /> Payment Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-ink/75">
            Your payment was cancelled. No appointment was booked. You can return to checkout and complete payment anytime.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => navigate('/checkout')}>Return to Checkout</Button>
            <Button variant="outline" onClick={() => navigate('/appointments')}>Back to Appointments</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PaymentCancelPage;
