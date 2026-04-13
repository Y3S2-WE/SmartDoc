import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck2, Search, Stethoscope, Video } from 'lucide-react';

import { AUTH_API_URL, DOCTOR_API_URL } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';

const initialForm = {
	appointmentType: 'physical',
	patientName: '',
	patientEmail: '',
	patientPhoneNumber: '',
	patientAddress: '',
	appointmentDate: '',
	appointmentTimeSlot: ''
};

function AppointmentsPage({ session }) {
	const navigate = useNavigate();
	const minSelectableDate = useMemo(() => {
		const now = new Date();
		const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
		return local.toISOString().split('T')[0];
	}, []);

	const [approvedDoctors, setApprovedDoctors] = useState([]);
	const [doctorProfiles, setDoctorProfiles] = useState({});
	const [searchName, setSearchName] = useState('');
	const [specializationFilter, setSpecializationFilter] = useState('all');
	const [hospitalFilter, setHospitalFilter] = useState('');
	const [selectedDoctorId, setSelectedDoctorId] = useState('');

	const [form, setForm] = useState({
		...initialForm,
		patientName: session.user.fullName || '',
		patientEmail: session.user.email || '',
		patientPhoneNumber: session.user.phoneNumber || ''
	});

	const [loading, setLoading] = useState(false);
	const [feedback, setFeedback] = useState('');

	useEffect(() => {
		const loadApprovedDoctors = async () => {
			setLoading(true);
			setFeedback('');

			try {
				const response = await axios.get(`${AUTH_API_URL}/doctors/approved`);
				const doctors = response.data.doctors || [];
				setApprovedDoctors(doctors);

				const profileEntries = await Promise.all(
					doctors.map(async (doctor) => {
						try {
							const profileResponse = await axios.get(`${DOCTOR_API_URL}/public/${doctor._id}/profile`);
							return [doctor._id, profileResponse.data.profile || {}];
						} catch {
							return [doctor._id, {}];
						}
					})
				);

				setDoctorProfiles(Object.fromEntries(profileEntries));
			} catch (error) {
				setFeedback(error.response?.data?.message || 'Unable to load approved doctors.');
			} finally {
				setLoading(false);
			}
		};

		loadApprovedDoctors();
	}, []);

	const specializationOptions = useMemo(() => {
		const values = approvedDoctors
			.map((doctor) => doctor.doctorProfile?.specialization || doctorProfiles[doctor._id]?.specialization || '')
			.filter(Boolean);

		return [...new Set(values)].sort((a, b) => a.localeCompare(b));
	}, [approvedDoctors, doctorProfiles]);

	const filteredDoctors = useMemo(() => {
		return approvedDoctors.filter((doctor) => {
			const profile = doctorProfiles[doctor._id] || {};
			const name = doctor.fullName || '';
			const specialization = doctor.doctorProfile?.specialization || profile.specialization || '';
			const hospital = doctor.doctorProfile?.hospitalOrClinicName || profile.hospitalOrClinicName || '';

			const nameMatches = name.toLowerCase().includes(searchName.trim().toLowerCase());
			const specializationMatches = specializationFilter === 'all' || specialization === specializationFilter;
			const hospitalMatches = hospital.toLowerCase().includes(hospitalFilter.trim().toLowerCase());

			return nameMatches && specializationMatches && hospitalMatches;
		});
	}, [approvedDoctors, doctorProfiles, searchName, specializationFilter, hospitalFilter]);

	const selectedDoctor = approvedDoctors.find((doctor) => doctor._id === selectedDoctorId) || null;
	const selectedDoctorProfile = selectedDoctor ? doctorProfiles[selectedDoctor._id] || {} : null;

	const selectedAvailability = (selectedDoctorProfile?.availabilitySchedule || []).filter(
		(item) => item?.date && item.date >= minSelectableDate
	);
	const selectedDateAvailability = selectedAvailability.find((item) => item.date === form.appointmentDate);
	const availableSlots = selectedDateAvailability?.timeSlots || [];

	useEffect(() => {
		if (!form.appointmentDate) {
			return;
		}

		const isAvailableDate = selectedAvailability.some((item) => item.date === form.appointmentDate);
		if (!isAvailableDate) {
			setForm((prev) => ({ ...prev, appointmentDate: '', appointmentTimeSlot: '' }));
		}
	}, [form.appointmentDate, selectedAvailability]);

	const handleBookNow = (doctorId) => {
		setSelectedDoctorId(doctorId);
		setForm((prev) => ({ ...prev, appointmentDate: '', appointmentTimeSlot: '' }));
		setFeedback('Doctor selected. Complete the appointment form and continue to checkout.');
	};

	const proceedToCheckout = (event) => {
		event.preventDefault();

		if (!selectedDoctor || !selectedDoctorProfile) {
			setFeedback('Please select a doctor first.');
			return;
		}

		if (!form.appointmentDate || !form.appointmentTimeSlot) {
			setFeedback('Please pick available date and time slot.');
			return;
		}

		if (form.appointmentDate < minSelectableDate) {
			setFeedback('Past dates are not available for booking.');
			return;
		}

		const checkoutDraft = {
			doctorAuthUserId: selectedDoctor._id,
			doctorName: selectedDoctor.fullName,
			doctorEmail: selectedDoctor.email || '',
			doctorPhoneNumber: selectedDoctor.phoneNumber || '',
			specialization: selectedDoctor.doctorProfile?.specialization || selectedDoctorProfile.specialization || '',
			hospitalOrClinicName:
				selectedDoctor.doctorProfile?.hospitalOrClinicName || selectedDoctorProfile.hospitalOrClinicName || '',
			doctorProfilePhoto: selectedDoctor.doctorProfile?.profilePhoto || selectedDoctorProfile.profilePhoto || '',
			channellingFee: Number(selectedDoctor.doctorProfile?.consultationFee || selectedDoctorProfile.consultationFee || 0),
			appointmentType: form.appointmentType,
			appointmentDate: form.appointmentDate,
			appointmentTimeSlot: form.appointmentTimeSlot,
			patientName: form.patientName,
			patientEmail: form.patientEmail,
			patientPhoneNumber: form.patientPhoneNumber,
			patientAddress: form.patientAddress
		};

		localStorage.setItem('smartdoc_pending_checkout', JSON.stringify(checkoutDraft));
		navigate('/checkout', { state: { checkoutDraft, sessionToken: session.token } });
	};

	return (
		<div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
			{feedback ? (
				<p className="mb-4 rounded-xl border border-white/30 bg-white/55 px-4 py-3 text-sm font-medium text-lake backdrop-blur">
					{feedback}
				</p>
			) : null}

			<div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
				<Card className="bg-white/55">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lake">
							<Search size={18} /> Find Approved Doctors
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="grid gap-2 md:grid-cols-2">
							<Input placeholder="Search by doctor name" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
							<select
								value={specializationFilter}
								onChange={(e) => setSpecializationFilter(e.target.value)}
								className="h-10 rounded-xl border border-lake/20 bg-white px-3 text-sm text-ink/90 outline-none transition focus:border-lake"
							>
								<option value="all">All Specializations</option>
								{specializationOptions.map((item) => (
									<option key={item} value={item}>{item}</option>
								))}
							</select>
						</div>

						<Input
							placeholder="Hospital / Clinic Name"
							value={hospitalFilter}
							onChange={(e) => setHospitalFilter(e.target.value)}
						/>

						<div className="space-y-2">
							{filteredDoctors.length === 0 ? (
								<p className="text-sm text-ink/65">{loading ? 'Loading doctors...' : 'No approved doctors found for filters.'}</p>
							) : (
								filteredDoctors.map((doctor) => {
									const profile = doctorProfiles[doctor._id] || {};
									const photo = doctor.doctorProfile?.profilePhoto || profile.profilePhoto || '';

									return (
										<div
											key={doctor._id}
											className="rounded-2xl border border-lake/15 bg-white p-4 shadow-sm transition hover:border-lake/25 hover:shadow-md"
										>
											<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
												<div className="flex items-start gap-4">
													{photo ? (
														<img src={photo} alt="Doctor" className="h-24 w-24 rounded-2xl object-cover ring-2 ring-lake/20" />
													) : (
														<div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-lake text-lg font-bold text-white">
															{(doctor.fullName || 'D').slice(0, 2).toUpperCase()}
														</div>
													)}
													<div className="space-y-1.5">
														<p className="text-base font-bold tracking-tight text-lake">{doctor.fullName}</p>
														<p className="inline-flex rounded-full bg-lake/10 px-2.5 py-1 text-xs font-semibold text-lake">
															{doctor.doctorProfile?.specialization || profile.specialization || 'Specialization not set'}
														</p>
														<p className="text-sm text-ink/75">{doctor.doctorProfile?.hospitalOrClinicName || profile.hospitalOrClinicName || 'Hospital not set'}</p>
														<p className="text-sm font-semibold text-ember">
															Fee: LKR {doctor.doctorProfile?.consultationFee || profile.consultationFee || 0}
														</p>
													</div>
												</div>

												<Button className="sm:min-w-[130px]" onClick={() => handleBookNow(doctor._id)}>
													Book Now
												</Button>
											</div>
										</div>
									);
								})
							)}
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white/58">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lake">
							<CalendarCheck2 size={18} /> Appointment Form
						</CardTitle>
					</CardHeader>
					<CardContent>
						{!selectedDoctor ? (
							<p className="text-sm text-ink/65">Select a doctor from the left list to continue booking.</p>
						) : (
							<>
								<div className="mb-4 rounded-2xl border border-lake/20 bg-white p-4 shadow-sm">
									<div className="flex items-start gap-4">
										{selectedDoctor.doctorProfile?.profilePhoto || selectedDoctorProfile.profilePhoto ? (
											<img
												src={selectedDoctor.doctorProfile?.profilePhoto || selectedDoctorProfile.profilePhoto}
												alt="Selected doctor"
												className="h-24 w-24 rounded-2xl object-cover ring-2 ring-lake/20"
											/>
										) : (
											<div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-lake text-lg font-bold text-white">
												{(selectedDoctor.fullName || 'D').slice(0, 2).toUpperCase()}
											</div>
										)}

										<div className="space-y-1.5">
											<p className="text-base font-bold tracking-tight text-lake">{selectedDoctor.fullName}</p>
											<p className="inline-flex rounded-full bg-lake/10 px-2.5 py-1 text-xs font-semibold text-lake">
												{selectedDoctor.doctorProfile?.specialization || selectedDoctorProfile.specialization || 'Specialization not set'}
											</p>
											<p className="text-sm text-ink/75">
												{selectedDoctor.doctorProfile?.hospitalOrClinicName || selectedDoctorProfile.hospitalOrClinicName || 'Hospital not set'}
											</p>
											<p className="text-sm font-semibold text-ember">
												Channelling Fee: LKR {selectedDoctor.doctorProfile?.consultationFee || selectedDoctorProfile.consultationFee || 0}
											</p>
										</div>
									</div>
								</div>

								<form onSubmit={proceedToCheckout} className="space-y-3">
									<div className="grid gap-3 md:grid-cols-2">
										<Field label="Patient Name"><Input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} required /></Field>
										<Field label="Email"><Input type="email" value={form.patientEmail} onChange={(e) => setForm({ ...form, patientEmail: e.target.value })} required /></Field>
										<Field label="Tel Number"><Input value={form.patientPhoneNumber} onChange={(e) => setForm({ ...form, patientPhoneNumber: e.target.value })} required /></Field>
										<Field label="Address"><Input value={form.patientAddress} onChange={(e) => setForm({ ...form, patientAddress: e.target.value })} required /></Field>
									</div>

									<Field label="Appointment Type">
										<div className="grid grid-cols-2 gap-2">
											<button
												type="button"
												className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
													form.appointmentType === 'physical' ? 'border-lake bg-lake/10 text-lake' : 'border-lake/20 bg-white text-ink/75'
												}`}
												onClick={() => setForm({ ...form, appointmentType: 'physical' })}
											>
												<Stethoscope size={14} className="mr-1 inline" /> Physical Consultation
											</button>
											<button
												type="button"
												className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
													form.appointmentType === 'video' ? 'border-lake bg-lake/10 text-lake' : 'border-lake/20 bg-white text-ink/75'
												}`}
												onClick={() => setForm({ ...form, appointmentType: 'video' })}
											>
												<Video size={14} className="mr-1 inline" /> Video Consultation
											</button>
										</div>
									</Field>

									<div className="grid gap-3 md:grid-cols-2">
										<Field label="Available Date">
											<select
												value={form.appointmentDate}
												onChange={(e) => setForm({ ...form, appointmentDate: e.target.value, appointmentTimeSlot: '' })}
												className="h-10 rounded-xl border border-lake/20 bg-white px-3 text-sm text-ink/90 outline-none transition focus:border-lake"
												required
											>
												<option value="">Select date</option>
												{selectedAvailability.map((item) => (
													<option key={item.date} value={item.date}>{item.date}</option>
												))}
											</select>
										</Field>

										<Field label="Available Time Slot">
											<select
												value={form.appointmentTimeSlot}
												onChange={(e) => setForm({ ...form, appointmentTimeSlot: e.target.value })}
												className="h-10 rounded-xl border border-lake/20 bg-white px-3 text-sm text-ink/90 outline-none transition focus:border-lake"
												required
											>
												<option value="">Select slot</option>
												{availableSlots.map((slot) => (
													<option key={slot} value={slot}>{slot}</option>
												))}
											</select>
										</Field>
									</div>

									<Button type="submit" className="w-full" disabled={loading}>
										{loading ? 'Please wait...' : 'Checkout'}
									</Button>
								</form>
							</>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function Field({ label, children }) {
	return (
		<label className="flex flex-col gap-1 text-sm font-medium text-ink/80">
			{label}
			{children}
		</label>
	);
}

export default AppointmentsPage;
