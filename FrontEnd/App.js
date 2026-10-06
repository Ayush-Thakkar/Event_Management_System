import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ||
  `http://${Platform.OS === 'android' ? '10.0.2.2' : 'localhost'}:5000/api`;

const COLORS = {
  ink: '#202b3c', muted: '#768194', paper: '#f5f6f8', white: '#ffffff',
  accent: '#d97745', accentDark: '#b95f32', line: '#e6e9ee', soft: '#fff1e9',
  green: '#34765b', red: '#a83d3d',
};

function Button({ title, onPress, disabled, secondary }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondaryButton,
        disabled && styles.disabledButton,
        pressed && !disabled && styles.pressedButton,
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{title}</Text>
    </Pressable>
  );
}

function EventCard({ event, onPress }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.eventCard, pressed && styles.cardPressed]}>
      <ImageBackground
        source={{ uri: event.image }}
        style={styles.cardImage}
        imageStyle={styles.cardImageRadius}
        onError={() => {}}
      >
        <View style={styles.imageShade} />
        {event.featured ? <Text style={styles.featuredTag}>FEATURED</Text> : null}
        <Text numberOfLines={2} style={styles.imageTitle}>{event.name}</Text>
      </ImageBackground>
      <View style={styles.cardBody}>
        <Text style={styles.category}>{event.category}</Text>
        <Text style={styles.cardMeta}>{formatDate(event.date)}  ·  {event.location}</Text>
        <Text style={styles.seatsText}>{event.availableSeats} seats available</Text>
      </View>
    </Pressable>
  );
}

function formatDate(value) {
  if (!value) return 'Date to be announced';
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function App() {
  const [events, setEvents] = useState([]);
  const [splash, setSplash] = useState(true);
  const splashOpacity = React.useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', tickets: '1' });
  const [booking, setBooking] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const loadEvents = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetch(`${API_BASE}/events`);
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Could not load events.');
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (error) {
      setLoadError(`${error.message} Check that the backend is running and API_BASE points to your computer.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, []);

  useEffect(() => {
    Animated.timing(splashOpacity, { toValue: 1, duration: 550, useNativeDriver: true }).start();
    const timer = setTimeout(() => setSplash(false), 1250);
    return () => clearTimeout(timer);
  }, [splashOpacity]);

  const categories = useMemo(() => ['All', ...new Set(events.map((event) => event.category).filter(Boolean))], [events]);
  const visibleEvents = useMemo(() => events.filter((event) => category === 'All' || event.category === category), [events, category]);
  const featured = visibleEvents.find((event) => event.featured) || visibleEvents[0];

  const openEvent = (event) => {
    setSelected(event);
    setBookingOpen(false);
    setForm({ name: '', email: '', phone: '', tickets: '1' });
    setFormError('');
    setConfirmation('');
  };

  const submitBooking = async () => {
    const tickets = Number(form.tickets);
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.tickets.trim()) {
      setFormError('Please complete every field.'); return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) { setFormError('Enter a valid email address.'); return; }
    if (!/^\+?[0-9\s()-]{7,20}$/.test(form.phone.trim())) { setFormError('Enter a valid phone number.'); return; }
    if (!Number.isInteger(tickets) || tickets < 1) { setFormError('Enter a whole number of tickets (at least 1).'); return; }
    if (tickets > selected.availableSeats) { setFormError(`Only ${selected.availableSeats} seats are available.`); return; }

    setBooking(true);
    setFormError('');
    try {
      const response = await fetch(`${API_BASE}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: selected._id, ...form, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), tickets }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Booking failed. Please try again.');
      setConfirmation(data.bookingId || 'Booking confirmed');
      setSelected((current) => current ? { ...current, availableSeats: current.availableSeats - tickets } : current);
      setEvents((current) => current.map((event) => event._id === selected._id ? { ...event, availableSeats: event.availableSeats - tickets } : event));
    } catch (error) {
      setFormError(error.message);
    } finally {
      setBooking(false);
    }
  };

  const resetToHome = () => { setSelected(null); setBookingOpen(false); setConfirmation(''); };

  if (splash) {
    return (
      <SafeAreaView style={[styles.safe, styles.splashScreen]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.paper} />
        <Animated.View style={{ alignItems: 'center', opacity: splashOpacity }}>
          <View style={[styles.brandMark, styles.splashMark]}><Text style={styles.brandMarkText}>E</Text></View>
          <Text style={styles.splashBrand}>EMS</Text>
          <Text style={styles.splashCaption}>Events, in one place.</Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.paper} />
      <View style={styles.topBar}>
        <Pressable onPress={resetToHome} accessibilityRole="button" style={styles.brandRow}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>E</Text></View>
          <Text style={styles.brand}>EMS</Text>
        </Pressable>
        {selected ? <Pressable onPress={resetToHome}><Text style={styles.backLink}>All events</Text></Pressable> : <Text style={styles.topCaption}>UPCOMING EVENTS</Text>}
      </View>

      {selected ? (
        <ScrollView contentContainerStyle={styles.detailScroll} keyboardShouldPersistTaps="handled">
          <ImageBackground source={{ uri: selected.image }} style={styles.detailImage} imageStyle={styles.detailImageRadius}>
            <View style={styles.imageShade} />
            <Text style={styles.detailCategory}>{selected.category}</Text>
            <Text style={styles.detailTitle}>{selected.name}</Text>
          </ImageBackground>
          <View style={styles.detailContent}>
            <Text style={styles.detailMeta}>{formatDate(selected.date)}  ·  {selected.time}</Text>
            <Text style={styles.detailLocation}>{selected.location}</Text>
            <Text style={styles.description}>{selected.description}</Text>
            <View style={styles.seatPanel}><Text style={styles.seatPanelValue}>{selected.availableSeats}</Text><Text style={styles.seatPanelLabel}>seats left</Text></View>
            {confirmation ? (
              <View style={styles.successBox}>
                <Text style={styles.successTitle}>You’re booked!</Text>
                <Text style={styles.successCopy}>Save this booking ID: <Text style={styles.bookingId}>{confirmation}</Text></Text>
                <Button title="Back to events" onPress={resetToHome} secondary />
              </View>
            ) : bookingOpen ? (
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <Text style={styles.formHeading}>Book your place</Text>
                <Text style={styles.fieldLabel}>Full name</Text>
                <TextInput style={styles.input} placeholder="Your name" placeholderTextColor="#9ba4b1" value={form.name} onChangeText={(name) => setForm({ ...form, name })} autoCapitalize="words" />
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor="#9ba4b1" value={form.email} onChangeText={(email) => setForm({ ...form, email })} keyboardType="email-address" autoCapitalize="none" />
                <Text style={styles.fieldLabel}>Phone</Text>
                <TextInput style={styles.input} placeholder="Phone number" placeholderTextColor="#9ba4b1" value={form.phone} onChangeText={(phone) => setForm({ ...form, phone })} keyboardType="phone-pad" />
                <Text style={styles.fieldLabel}>Tickets</Text>
                <TextInput style={styles.input} placeholder="1" placeholderTextColor="#9ba4b1" value={form.tickets} onChangeText={(tickets) => setForm({ ...form, tickets })} keyboardType="number-pad" />
                {formError ? <Text accessibilityRole="alert" style={styles.errorText}>{formError}</Text> : null}
                <Button title={booking ? 'Submitting…' : 'Confirm booking'} onPress={submitBooking} disabled={booking} />
                <Button title="Cancel" onPress={() => { setBookingOpen(false); setFormError(''); }} secondary />
              </KeyboardAvoidingView>
            ) : (
              <Button title={selected.availableSeats > 0 ? 'Register for this event' : 'Sold out'} onPress={() => setBookingOpen(true)} disabled={selected.availableSeats < 1} />
            )}
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.homeScroll}>
          <Text style={styles.eyebrow}>WHAT’S ON</Text>
          <Text style={styles.homeTitle}>Plans worth{ '\n' }putting on the calendar.</Text>
          <Text style={styles.homeSubtitle}>Browse upcoming events and book your place.</Text>
          {featured ? <>
            <Text style={styles.sectionTitle}>Featured event</Text>
            <EventCard event={featured} onPress={() => openEvent(featured)} />
          </> : null}
          <View style={styles.listHeading}><Text style={styles.sectionTitle}>Explore events</Text><Text style={styles.eventCount}>{visibleEvents.length} events</Text></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {categories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.categoryChip, item === category && styles.categoryChipActive]}><Text style={[styles.categoryChipText, item === category && styles.categoryChipTextActive]}>{item}</Text></Pressable>)}
          </ScrollView>
          {loading ? <View style={styles.centerState}><ActivityIndicator size="small" color={COLORS.accent} /><Text style={styles.stateText}>Loading events…</Text></View> : null}
          {!loading && loadError ? <View style={styles.messagePanel}><Text style={styles.errorText}>{loadError}</Text><Button title="Try again" onPress={loadEvents} secondary /></View> : null}
          {!loading && !loadError && visibleEvents.length === 0 ? <View style={styles.messagePanel}><Text style={styles.stateText}>No events in this category yet.</Text></View> : null}
          {!loading && !loadError ? visibleEvents.filter((event) => event._id !== featured?._id).map((event) => <EventCard key={event._id} event={event} onPress={() => openEvent(event)} />) : null}
          {!loading && !loadError && featured && visibleEvents.length === 1 && visibleEvents[0]._id === featured._id ? <Text style={styles.stateText}>That’s everything for now.</Text> : null}
          <Text style={styles.footer}>EMS · Event Management System</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.paper },
  splashScreen: { alignItems: 'center', justifyContent: 'center' },
  splashMark: { width: 50, height: 50, borderRadius: 16 },
  splashBrand: { color: COLORS.ink, fontWeight: '800', fontSize: 30, letterSpacing: -1, marginTop: 11 },
  splashCaption: { color: COLORS.muted, fontSize: 14, marginTop: 5 },
  topBar: { height: 58, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark: { width: 26, height: 26, borderRadius: 9, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: COLORS.white, fontWeight: '800', fontSize: 17, lineHeight: 22 },
  brand: { color: COLORS.ink, fontWeight: '800', fontSize: 20, letterSpacing: -0.6 },
  topCaption: { color: COLORS.muted, fontWeight: '700', fontSize: 9, letterSpacing: 1.2 },
  backLink: { color: COLORS.accentDark, fontWeight: '700', fontSize: 14 },
  homeScroll: { paddingHorizontal: 22, paddingBottom: 34 },
  eyebrow: { color: COLORS.accentDark, fontWeight: '800', fontSize: 10, letterSpacing: 1.4, marginTop: 22 },
  homeTitle: { color: COLORS.ink, fontWeight: '800', fontSize: 34, lineHeight: 39, letterSpacing: -1, marginTop: 10 },
  homeSubtitle: { color: COLORS.muted, fontSize: 15, marginTop: 9, marginBottom: 25 },
  sectionTitle: { color: COLORS.ink, fontWeight: '700', fontSize: 18, marginBottom: 13 },
  eventCard: { backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden', marginBottom: 15, borderWidth: 1, borderColor: '#eef0f3' },
  cardPressed: { opacity: 0.88 },
  cardImage: { height: 174, justifyContent: 'flex-end', padding: 15, backgroundColor: '#aab3bd' },
  cardImageRadius: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  imageShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(16, 27, 42, 0.34)' },
  featuredTag: { position: 'absolute', left: 14, top: 13, color: COLORS.white, backgroundColor: COLORS.accent, overflow: 'hidden', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 5, fontSize: 9, letterSpacing: 0.7, fontWeight: '800' },
  imageTitle: { color: COLORS.white, fontSize: 24, lineHeight: 29, fontWeight: '800', maxWidth: '90%' },
  cardBody: { paddingHorizontal: 15, paddingVertical: 13 },
  category: { color: COLORS.accentDark, fontWeight: '700', fontSize: 12, marginBottom: 5 },
  cardMeta: { color: COLORS.muted, fontSize: 12, lineHeight: 18 },
  seatsText: { color: COLORS.green, fontSize: 11, fontWeight: '700', marginTop: 8 },
  listHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 13 },
  eventCount: { color: COLORS.muted, fontSize: 12, marginBottom: 13 },
  categoryRow: { gap: 8, paddingBottom: 15 },
  categoryChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line },
  categoryChipActive: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  categoryChipText: { color: COLORS.muted, fontSize: 12, fontWeight: '600' },
  categoryChipTextActive: { color: COLORS.white },
  centerState: { paddingVertical: 30, alignItems: 'center', gap: 9 },
  stateText: { color: COLORS.muted, textAlign: 'center', fontSize: 14, marginVertical: 12 },
  messagePanel: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 15 },
  footer: { color: '#a0a8b4', textAlign: 'center', fontSize: 11, marginTop: 12 },
  detailScroll: { paddingHorizontal: 18, paddingBottom: 35 },
  detailImage: { height: 245, justifyContent: 'flex-end', padding: 20, backgroundColor: '#aab3bd' },
  detailImageRadius: { borderRadius: 18 },
  detailCategory: { color: COLORS.white, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  detailTitle: { color: COLORS.white, fontSize: 30, lineHeight: 35, fontWeight: '800', letterSpacing: -0.6 },
  detailContent: { paddingTop: 19 },
  detailMeta: { color: COLORS.accentDark, fontWeight: '700', fontSize: 14 },
  detailLocation: { color: COLORS.ink, fontWeight: '600', fontSize: 16, marginTop: 7 },
  description: { color: COLORS.muted, fontSize: 14, lineHeight: 22, marginTop: 15, marginBottom: 15 },
  seatPanel: { flexDirection: 'row', alignItems: 'baseline', gap: 7, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.line, paddingVertical: 13, marginBottom: 18 },
  seatPanelValue: { color: COLORS.ink, fontWeight: '800', fontSize: 22 },
  seatPanelLabel: { color: COLORS.muted, fontSize: 13 },
  button: { backgroundColor: COLORS.accent, borderRadius: 11, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 10, paddingHorizontal: 16 },
  buttonText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  secondaryButton: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line },
  secondaryButtonText: { color: COLORS.ink },
  disabledButton: { opacity: 0.5 },
  pressedButton: { backgroundColor: COLORS.accentDark },
  formHeading: { color: COLORS.ink, fontWeight: '800', fontSize: 20, marginTop: 5, marginBottom: 12 },
  fieldLabel: { color: COLORS.ink, fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 10 },
  input: { minHeight: 46, paddingHorizontal: 13, borderRadius: 10, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.white, color: COLORS.ink, fontSize: 14 },
  errorText: { color: COLORS.red, fontSize: 13, lineHeight: 19, marginTop: 10 },
  successBox: { backgroundColor: '#edf6f0', borderRadius: 13, padding: 16, marginTop: 2 },
  successTitle: { color: COLORS.green, fontSize: 19, fontWeight: '800' },
  successCopy: { color: COLORS.ink, fontSize: 13, lineHeight: 20, marginTop: 7 },
  bookingId: { fontWeight: '800' },
});
