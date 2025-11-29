"use client";
import React, { useMemo, useState } from 'react';
import { TextInput } from '@/components/ui/TextInput';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { CheckboxGroup } from '@/components/ui/CheckboxGroup';
import { DatePicker } from '@/components/ui/DatePicker';
import DestinationTree from '@/components/DestinationTree';
import { predefinedRoutes } from '@/lib/data';
import { generateNext14Months, labelForMonth, rangeLabel, travelLevelTitle } from '@/lib/form-helpers';
import type { SelectedItem } from '@/components/DestinationTree';

type NightRange = '1-week' | '10-nights' | '14-nights' | '21-nights';

export default function Page() {
  // Q1/Q2
  const [clientName, setClientName] = useState('');
  const [numTravellers, setNumTravellers] = useState<string>('2');

  // Q3 Months + specific date
  const months = useMemo(() => generateNext14Months(), []);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [specificDate, setSpecificDate] = useState('');

  // Q4 Route preference
  const [routePreference, setRoutePreference] = useState<'predefined' | 'trip-design' | ''>('');
  const [selectedRoute, setSelectedRoute] = useState<string>('');

  // Q5 (Trip Design path) Nights
  const [nightRange, setNightRange] = useState<NightRange | ''>('');
  const [exactNights, setExactNights] = useState<boolean>(false);
  const [exactNightCount, setExactNightCount] = useState<string>('');

  // Q6 Golf
  const [golfTrip, setGolfTrip] = useState<'yes' | 'no' | ''>('');
  const [golfRounds, setGolfRounds] = useState<string>('');

  // Q7 Destinations + hotels
  const [selectedDestinations, setSelectedDestinations] = useState<SelectedItem[]>([]);

  // General section
  const [travelLevel, setTravelLevel] = useState<'smart' | 'comfortable' | 'luxury' | ''>('');
  const [accommodationType, setAccommodationType] = useState<string>('');
  const [generalNotes, setGeneralNotes] = useState('');

  // Form behaviors similar to original: selecting months clears specific date and vice versa
  const onMonthsChange = (vals: string[]) => {
    setSelectedMonths(vals);
    if (vals.length > 0) setSpecificDate('');
  };
  const onSpecificDateChange = (val: string) => {
    setSpecificDate(val);
    if (val) setSelectedMonths([]);
  };

  // Exact nights vs ranges behavior
  const toggleExactNights = (checked: boolean) => {
    setExactNights(checked);
    if (checked) {
      setNightRange('');
    } else {
      setExactNightCount('');
    }
  };

  const minDate = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return t.toISOString().split('T')[0];
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = {
      clientName,
      numTravellers,
      travelMonths: selectedMonths.map((v) => ({ value: v, text: labelForMonth(v) })),
      specificDate,
      routePreference,
      selectedRoute: selectedRoute
        ? { value: selectedRoute, text: predefinedRoutes.find((r) => r.id === selectedRoute)?.label ?? '' }
        : null,
      nightsPreference:
        exactNights && exactNightCount
          ? { type: 'exact', value: exactNightCount, text: `${exactNightCount} nights exactly` }
          : nightRange
          ? { type: 'range', value: nightRange, text: rangeLabel(nightRange) }
          : null,
      golfInfo:
        golfTrip === 'yes'
          ? { isGolfTrip: true, rounds: golfRounds || null }
          : golfTrip === 'no'
          ? { isGolfTrip: false, rounds: null }
          : null,
      destinations: selectedDestinations,
      travelLevel: travelLevel ? { value: travelLevel, text: travelLevelTitle(travelLevel) } : null,
      accommodationType: accommodationType ? { value: accommodationType, text: accommodationType } : null,
      generalNotes,
      timestamp: new Date().toISOString(),
    } as const;

    // Match original HTML webhook branching behavior
    let webhookUrl: string | null = null;
    if (routePreference === 'predefined') {
      // Validate selected route as in original
      if (!selectedRoute) {
        alert('Please select a specific route from the available options (Question 5).');
        return;
      }
      webhookUrl = 'https://n8n-utni.onrender.com/webhook/7a52ca95-0d6c-4b45-85f7-97e5d06531ec';
    } else if (routePreference === 'trip-design') {
      webhookUrl = 'https://n8n-utni.onrender.com/webhook/a50bcb3f-8b8a-4628-9e35-75c68a9f50b9';
    } else {
      alert('Please select a route preference before submitting the form.');
      return;
    }

    try {
      // First, save to Supabase (with null agency_id for main domain)
      const submissionResponse = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_id: null,
          form_data: formData,
        }),
      });

      if (!submissionResponse.ok) {
        console.error('Failed to save submission to database');
        // Continue anyway to send webhook
      } else {
        const submissionData = await submissionResponse.json();
        console.log('Form saved to database:', submissionData);
      }

      // Then send to webhook
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!webhookResponse.ok) throw new Error('Network response was not ok');
      
      await webhookResponse.json().catch(() => ({}));

      if (routePreference === 'predefined') {
        alert('Pre-defined route selected successfully! We will contact you with your chosen route details.');
      } else {
        alert('Trip design form submitted successfully! We will contact you to plan your custom trip.');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('There was an error submitting the form. Please try again.');
    }

    console.log('Form Data:', formData);
  };

  const canSubmit = useMemo(() => {
    if (!routePreference) return false;
    if (routePreference === 'predefined') return !!selectedRoute;
    return true; // trip-design allows submit without further requirements
  }, [routePreference, selectedRoute]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="card p-6">
        <h1 className="text-3xl font-semibold text-center text-gray-800 mb-6">Travel Planning Form</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Q1 */}
          <div>
            <div className="question-title">1) Client name</div>
            <TextInput id="clientName" value={clientName} onChange={setClientName} placeholder="Enter your full name" />
          </div>

          {/* Q2 */}
          <div>
            <div className="question-title">2) Number of travellers</div>
            <TextInput id="numTravellers" type="number" value={numTravellers} onChange={setNumTravellers} className="max-w-xs" />
          </div>

          {/* Q3 */}
          <div>
            <div className="question-title">3) When do you want to travel? (multiple selections possible)</div>
            <CheckboxGroup
              name="travelMonths"
              options={months.map((m, i) => ({ id: `month-${i}`, value: m.value, label: m.label }))}
              values={selectedMonths}
              onChange={onMonthsChange}
            />
            <div className="mt-4">
              <DatePicker id="specificDate" label="Specific start date:" value={specificDate} min={minDate} onChange={onSpecificDateChange} />
            </div>
          </div>

          {/* Q4 */}
          <div>
            <div className="question-title">4) What kind of routes do you prefer?</div>
            <RadioGroup
              name="routePreference"
              options={[
                { id: 'predefinedRoutes', value: 'predefined', label: 'Pre-defined Routes' },
                { id: 'tripDesign', value: 'trip-design', label: 'Trip Design' },
              ]}
              value={routePreference}
              onChange={(v) => setRoutePreference(v as any)}
            />
          </div>

          {/* Q5A - Predefined route */}
          {routePreference === 'predefined' ? (
            <div>
              <div className="question-title">5) Which pre-defined route would you like?</div>
              <RadioGroup
                name="selectedRoute"
                options={predefinedRoutes.map((r) => ({ id: r.id, value: r.id, label: r.label }))}
                value={selectedRoute}
                onChange={setSelectedRoute}
                className=""
                itemClassName=""
              />
            </div>
          ) : null}

          {/* Conditional Questions - Trip Design */}
          {routePreference === 'trip-design' ? (
            <div className="space-y-6">
              {/* Q5 Nights */}
              <div>
                <div className="question-title">5) How many Nights?</div>
                <RadioGroup
                  name="nightRange"
                  options={[
                    { id: 'week1', value: '1-week', label: '1 Week' },
                    { id: 'nights10', value: '10-nights', label: '10 Nights' },
                    { id: 'nights14', value: '14-nights', label: '14 Nights' },
                    { id: 'nights21', value: '21-nights', label: '21 Nights' },
                  ]}
                  value={nightRange}
                  onChange={(v) => {
                    setNightRange(v as NightRange);
                    setExactNights(false);
                    setExactNightCount('');
                  }}
                />
                <div className="mt-4 rounded-md bg-gray-50 p-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <input
                      type="checkbox"
                      checked={!!exactNights}
                      onChange={(e) => toggleExactNights(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Exact number of nights
                  </label>
                  <div className={`mt-3 ${exactNights ? '' : 'opacity-50 pointer-events-none'}`}>
                    <label htmlFor="exactNightCount" className="label">Number of nights:</label>
                    <input
                      id="exactNightCount"
                      type="number"
                      className="input w-24"
                      value={exactNightCount}
                      onChange={(e) => setExactNightCount(e.target.value)}
                      min={1}
                      max={365}
                    />
                  </div>
                </div>
              </div>

              {/* Q6 Golf */}
              <div>
                <div className="question-title">6) Is this a golf trip?</div>
                <RadioGroup
                  name="golfTrip"
                  options={[
                    { id: 'golfYes', value: 'yes', label: 'Yes' },
                    { id: 'golfNo', value: 'no', label: 'No' },
                  ]}
                  value={golfTrip}
                  onChange={(v) => setGolfTrip(v as 'yes' | 'no')}
                />
                {golfTrip === 'yes' ? (
                  <div className="mt-4 rounded-md border-l-4 border-sky-600 bg-sky-50 p-4">
                    <label htmlFor="golfRounds" className="label">More or less, how many rounds of golf?</label>
                    <input
                      id="golfRounds"
                      type="number"
                      className="input w-24"
                      value={golfRounds}
                      onChange={(e) => setGolfRounds(e.target.value)}
                      min={1}
                      max={50}
                    />
                  </div>
                ) : null}
              </div>

              {/* Q7 Destination selector */}
              <div>
                <div className="question-title">7) Where would you like to go?</div>
                <DestinationTree
                  value={selectedDestinations}
                  onChange={setSelectedDestinations}
                />
              </div>

              {/* General Section */}
              <div className="section-title">General</div>

              {/* Q8 Travel level */}
              <div>
                <div className="question-title">8) What level of travel?</div>
                <RadioGroup
                  name="travelLevel"
                  options={[
                    {
                      id: 'smart',
                      value: 'smart',
                      label: (
                        <div>
                          <span className="block font-bold">Smart</span>
                          <span className="text-sm">My focus is on the experiences, not necessarily a luxurious hotel</span>
                        </div>
                      ),
                    },
                    {
                      id: 'comfortable',
                      value: 'comfortable',
                      label: (
                        <div>
                          <span className="block font-bold">Comfortable</span>
                          <span className="text-sm">I like special touches in my accommodation</span>
                        </div>
                      ),
                    },
                    {
                      id: 'luxury',
                      value: 'luxury',
                      label: (
                        <div>
                          <span className="block font-bold">Luxury</span>
                          <span className="text-sm">I prefer beautiful design and excellent service</span>
                        </div>
                      ),
                    },
                  ]}
                  value={travelLevel}
                  onChange={(v) => setTravelLevel(v as any)}
                />
              </div>

              {/* Q9 Accommodation type */}
              <div>
                <div className="question-title">9) Accommodation type</div>
                <RadioGroup
                  name="accommodationType"
                  options={[
                    { id: 'bnb', value: 'bnb', label: 'Bed & Breakfast' },
                    { id: 'boutique', value: 'boutique', label: 'Boutique Accommodation' },
                    { id: 'hotel-services', value: 'hotel-services', label: 'Hotel with 24 Hour service and a nice bar and pool area' },
                    { id: 'star4', value: '4-star', label: '4 Star' },
                    { id: 'star5', value: '5-star', label: '5 Star' },
                    { id: 'star5-superior', value: '5-star-superior', label: '5 Star Superior' },
                  ]}
                  value={accommodationType}
                  onChange={setAccommodationType}
                />
              </div>

              {/* General Notes */}
              <div>
                <label htmlFor="generalNotes" className="question-title text-base font-medium">General Notes</label>
                <textarea
                  id="generalNotes"
                  rows={4}
                  className="input w-full"
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                />
              </div>
            </div>
          ) : null}

          <div className="pt-4">
            <button type="submit" className="btn mx-auto block" disabled={!canSubmit}>
              Continue
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

