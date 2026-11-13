# Sources and verification notes

These references provide broad factual context only. None of the linked NASA pages is a source for AstroPulse’s numeric alert thresholds, fictional crew baselines, cabin readings, exercise target, or medical-protocol text; those remain explicitly illustrative.

## NASA spaceflight-health context

- [NASA Human Health Countermeasures](https://www.nasa.gov/humans-in-space/hhc-spaceflight-risks/) — NASA describes cardiovascular adaptation, decompression sickness, sleep, radiation, and other human-health risks. Supports the choice of broad dashboard topics, not a numeric cutoff.
- [NASA Human Research Program: Radiation](https://www.nasa.gov/hrp/radiation/) — overview of radiation-related human spaceflight risk. No AstroPulse mSv threshold is derived from this page.
- [NASA Space Radiation Analysis Group](https://srag.jsc.nasa.gov/Index.cfm) — radiation monitoring, analysis, and support context, including exposure minimization. Does not provide a demo-specific warning threshold.
- [NASA SANS overview](https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/) — background on spaceflight-associated neuro-ocular changes and headward fluid shift.
- [NASA Human Factors and Behavioral Performance](https://www.nasa.gov/hrp/human-factors-and-behavioral-performance/) — long-duration mission human-performance context, including behavioral-health considerations.
- [NASA Moon Facts](https://science.nasa.gov/moon/facts/) — contextual lunar facts; NASA gives lunar surface gravity as about one-sixth of Earth gravity. Gateway’s microgravity and the mission schedule in the demo are illustrative.
- [NASA Mars Facts](https://science.nasa.gov/mars/facts/) — Mars context. It does not validate this project’s orbital distance curve or delay estimates.

## Physical constant

- [NIST speed of light in vacuum](https://physics.nist.gov/cgi-bin/cuu/Value?c) — exact value `299,792,458 m/s`; the code converts it to `299,792.458 km/s`. The separate Mars distance approximation remains unverified.

## Interpretation

`verified: true` is used only when a source directly supports the narrow statement in its `SourceNote`. Project requirements, human factors, or general NASA context must not be presented as evidence that a simulated threshold is a medical standard or an approved spacecraft setpoint.
