using System;

namespace EHAinElTurck.Plannings.Licensing
{
    /// <summary>
    /// Applies business rules after cryptographic verification has succeeded.
    /// This class does NOT verify signatures and must never be used as a substitute for it.
    /// </summary>
    public static class LicensePolicy
    {
        public static LicenseEvaluation Evaluate(
            LicenseDocument license,
            bool signatureVerified,
            string currentMachineId,
            bool clockRollbackDetected,
            DateTime utcNow)
        {
            if (license == null)
                return new LicenseEvaluation(LicenseState.Unactivated, "LICENSE_NOT_INSTALLED");

            if (!signatureVerified || !license.HasRequiredFields())
                return new LicenseEvaluation(LicenseState.Invalid, "LICENSE_INVALID");

            if (clockRollbackDetected)
                return new LicenseEvaluation(LicenseState.ClockTampered, "CLOCK_ROLLBACK_DETECTED");

            if (!String.Equals(license.MachineId, currentMachineId, StringComparison.OrdinalIgnoreCase))
                return new LicenseEvaluation(LicenseState.HardwareMismatch, "MACHINE_MISMATCH");

            if (license.LicenseType == "TIME_LIMITED")
            {
                if (!license.ExpiresAtUtc.HasValue || utcNow.Kind != DateTimeKind.Utc)
                    return new LicenseEvaluation(LicenseState.Invalid, "INVALID_EXPIRATION_DATE");

                if (utcNow >= license.ExpiresAtUtc.Value)
                    return new LicenseEvaluation(LicenseState.Expired, "LICENSE_EXPIRED");
            }

            return new LicenseEvaluation(LicenseState.Active, "LICENSE_VALID");
        }
    }
}
