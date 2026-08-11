"""Clinical trial success/risk estimation.

IMPORTANT — read before trusting these numbers: this is a transparent,
documented heuristic combining (a) commonly-cited industry-average phase
transition rates and (b) the compound's own ADMET/toxicity scores if you
supply them (from prediction-service). It is NOT a validated biostatistical
or clinical model, has not been trained or calibrated on real trial-outcome
data, and should not be presented to a clinician or regulator as a clinical
prediction. Treat the output as a rough, explainable starting point for
triage, not a substitute for real biostatistics.

The phase base rates below are commonly-cited industry-average approximations
(the kind found in BIO/QLS-style clinical development success-rate reports) —
they are ballpark figures for illustration, not a specific verified dataset
this code has fetched. Override them via `phase_base_rate_override` if you
have better priors for your therapeutic area.
"""

# Commonly-cited approximate phase-transition success rates (illustrative, not a
# specific verified source — override if you have real historical data for your program).
DEFAULT_PHASE_BASE_RATES = {
    "preclinical": 0.10,
    "phase_1": 0.15,
    "phase_2": 0.30,
    "phase_3": 0.55,
    "phase_4": 0.90,
}


def estimate_success_and_risk(
    phase: str,
    cohort_size: int | None = None,
    admet_score: float | None = None,
    toxicity_score: float | None = None,
    phase_base_rate_override: float | None = None,
) -> dict:
    base_rate = phase_base_rate_override if phase_base_rate_override is not None else DEFAULT_PHASE_BASE_RATES.get(phase, 0.10)

    # Cohort-size adjustment: larger, better-powered cohorts modestly raise confidence
    # in the estimate itself (not the underlying biology) — capped modest effect.
    cohort_adjustment = 0.0
    if cohort_size:
        if cohort_size < 20:
            cohort_adjustment = -0.05
        elif cohort_size > 200:
            cohort_adjustment = 0.05

    # Compound-quality adjustment from real ADMET/toxicity scores, if supplied.
    admet_adjustment = ((admet_score - 0.5) * 0.15) if admet_score is not None else 0.0
    toxicity_adjustment = (-(toxicity_score) * 0.20) if toxicity_score is not None else 0.0

    success_prediction = base_rate + cohort_adjustment + admet_adjustment + toxicity_adjustment
    success_prediction = max(0.01, min(0.99, success_prediction))

    risk_flags = []
    if toxicity_score is not None and toxicity_score > 0.6:
        risk_flags.append("Elevated predicted toxicity — recommend additional preclinical toxicology review.")
    if admet_score is not None and admet_score < 0.4:
        risk_flags.append("Weak predicted ADMET profile — bioavailability/exposure risk.")
    if cohort_size is not None and cohort_size < 20:
        risk_flags.append("Small cohort size — estimate has wide uncertainty; underpowered for firm conclusions.")
    if not risk_flags:
        risk_flags.append("No elevated risk flags from the available inputs.")

    return {
        "success_prediction": round(success_prediction, 4),
        "risk_analysis": {
            "base_rate_used": base_rate,
            "cohort_adjustment": cohort_adjustment,
            "admet_adjustment": round(admet_adjustment, 4),
            "toxicity_adjustment": round(toxicity_adjustment, 4),
            "flags": risk_flags,
            "methodology_note": (
                "Heuristic combination of illustrative phase base rates and, if supplied, "
                "real ADMET/toxicity scores from prediction-service. Not a validated clinical model."
            ),
        },
    }
