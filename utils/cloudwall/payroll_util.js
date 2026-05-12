// payroll_util.js

class PayrollWeek {
  constructor(weeksFromNow = 0) {
    const today = new Date();
    today.setDate(today.getDate() + 7 * weeksFromNow);

    const dayOfWeek = today.getDay();

    if (dayOfWeek === 1 || dayOfWeek === 2) {
      this._weekEndingSunday = new Date(today);
      this._weekEndingSunday.setDate(today.getDate() - dayOfWeek);
    } else if (dayOfWeek >= 3 && dayOfWeek <= 6) {
      this._weekEndingSunday = new Date(today);
      this._weekEndingSunday.setDate(today.getDate() + (7 - dayOfWeek));
    } else {
      this._weekEndingSunday = new Date(today);
    }

    this._weekEndingSunday.setHours(0, 0, 0, 0);
  }

  monday() { return this._offsetDate(-6); }
  tuesday() { return this._offsetDate(-5); }
  wednesday() { return this._offsetDate(-4); }
  thursday() { return this._offsetDate(-3); }
  friday() { return this._offsetDate(-2); }
  saturday() { return this._offsetDate(-1); }
  sunday() { return new Date(this._weekEndingSunday); }

  sundayStringShort() { return this._formatDate('MM/DD/YYYY'); }
  sundayStringShortDmy() { return this._formatDate('DD/MM/YYYY'); }

  sundayStringAbv() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mm = months[this._weekEndingSunday.getMonth()];
    const dd = String(this._weekEndingSunday.getDate()).padStart(2, '0');
    const yyyy = this._weekEndingSunday.getFullYear();
    return `${mm} ${dd}, ${yyyy}`;
  }

  sundayStringFull() {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const mm = months[this._weekEndingSunday.getMonth()];
    const dd = String(this._weekEndingSunday.getDate()).padStart(2, '0');
    const yyyy = this._weekEndingSunday.getFullYear();
    return `${mm} ${dd}, ${yyyy}`;
  }

  _offsetDate(days) {
    const d = new Date(this._weekEndingSunday);
    d.setDate(d.getDate() + days);
    return d;
  }

  _formatDate(format) {
    const mm = String(this._weekEndingSunday.getMonth() + 1).padStart(2, '0');
    const dd = String(this._weekEndingSunday.getDate()).padStart(2, '0');
    const yyyy = this._weekEndingSunday.getFullYear();
    return format === 'DD/MM/YYYY' ? `${dd}/${mm}/${yyyy}` : `${mm}/${dd}/${yyyy}`;
  }
}

module.exports = { PayrollWeek };
