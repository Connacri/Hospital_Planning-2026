using System;

namespace EHAinElTurck.Plannings.Licensing
{
    public enum LicenseState
    {
        Unactivated = 0,
        Active = 1,
        Expired = 2,
        Invalid = 3,
        HardwareMismatch = 4,
        ClockTampered = 5,
        Revoked = 6
    }

    public sealed class LicenseEvaluation
    {
        public LicenseState State { get; private set; }
        public string ReasonCode { get; private set; }
        public bool AllowsBusinessFeatures { get { return State == LicenseState.Active; } }
        public bool AllowsActivationUi { get { return true; } }
        public bool MustPreserveLocalData { get { return true; } }

        public LicenseEvaluation(LicenseState state, string reasonCode)
        {
            State = state;
            ReasonCode = reasonCode ?? String.Empty;
        }
    }
}
