package inputs

import "testing"

func TestParseKV(t *testing.T) {
	cases := []struct {
		name    string
		in      []string
		want    map[string]string
		wantErr string
	}{
		{name: "empty", in: nil, want: map[string]string{}},
		{
			name: "single pair",
			in:   []string{"name=Alice"},
			want: map[string]string{"name": "Alice"},
		},
		{
			name: "multiple pairs",
			in:   []string{"name=Alice", "age=30"},
			want: map[string]string{"name": "Alice", "age": "30"},
		},
		{
			name: "value with equals sign",
			in:   []string{"query=a=b&c=d"},
			want: map[string]string{"query": "a=b&c=d"},
		},
		{
			name: "empty value is allowed",
			in:   []string{"empty="},
			want: map[string]string{"empty": ""},
		},
		{
			name:    "missing equals",
			in:      []string{"no-equals"},
			wantErr: "must be key=value",
		},
		{
			name:    "empty key",
			in:      []string{"=value"},
			wantErr: "must be key=value",
		},
		{
			name:    "duplicate key",
			in:      []string{"k=1", "k=2"},
			wantErr: "provided more than once",
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := ParseKV(tc.in)
			if tc.wantErr != "" {
				if err == nil {
					t.Fatalf("expected error containing %q, got nil", tc.wantErr)
				}
				if !contains(err.Error(), tc.wantErr) {
					t.Fatalf("expected error containing %q, got %q", tc.wantErr, err.Error())
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if len(got) != len(tc.want) {
				t.Fatalf("len mismatch: got %v, want %v", got, tc.want)
			}
			for k, v := range tc.want {
				if got[k] != v {
					t.Fatalf("key %q: got %q, want %q", k, got[k], v)
				}
			}
		})
	}
}

func contains(s, sub string) bool {
	if len(sub) == 0 {
		return true
	}
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}
