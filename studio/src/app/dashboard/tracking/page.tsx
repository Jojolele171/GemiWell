'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Apple, Droplets, Footprints, Bed } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { mockFoodLog, type FoodLog } from '@/lib/data';

function DietTracker() {
  const [foodLog, setFoodLog] = useState<FoodLog[]>(mockFoodLog);
  const totalCalories = foodLog.reduce((sum, item) => sum + item.calories, 0);

  const handleAddFood = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('foodName') as string;
    const calories = parseInt(formData.get('calories') as string, 10);

    if (name && !isNaN(calories)) {
      const newFood: FoodLog = {
        id: `FOOD${Date.now()}`,
        name,
        calories,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setFoodLog(prev => [newFood, ...prev]);
      event.currentTarget.reset();
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Log Food</CardTitle>
          <CardDescription>Add a food item to your daily log.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddFood} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="foodName">Food Name</Label>
              <Input id="foodName" name="foodName" placeholder="e.g., Apple" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calories">Calories</Label>
              <Input id="calories" name="calories" type="number" placeholder="e.g., 95" required />
            </div>
            <Button type="submit" className="w-full">Add Food</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Today's Log</CardTitle>
          <CardDescription>
            Total Calories: <span className="font-bold text-primary">{totalCalories}</span> kcal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Food</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Calories</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {foodLog.map((food) => (
                <TableRow key={food.id}>
                  <TableCell>{food.name}</TableCell>
                  <TableCell>{food.time}</TableCell>
                  <TableCell className="text-right">{food.calories} kcal</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function HabitTracker() {
  const [sleep, setSleep] = useState([8]);
  const [steps, setSteps] = useState([7500]);
  
  // Water Intake State
  const [waterValue, setWaterValue] = useState([6]); // default 6 glasses
  const [waterUnit, setWaterUnit] = useState<'glasses' | 'liters'>('glasses');

  // Constants for conversion
  const GLASS_TO_LITER = 0.25;
  const LITER_TO_GLASS = 4;

  const handleUnitToggle = (checked: boolean) => {
    const newUnit = checked ? 'liters' : 'glasses';
    if (newUnit === 'liters' && waterUnit === 'glasses') {
      // Convert glasses to liters
      const liters = waterValue[0] * GLASS_TO_LITER;
      setWaterValue([parseFloat(liters.toFixed(1))]);
    } else if (newUnit === 'glasses' && waterUnit === 'liters') {
      // Convert liters to glasses
      const glasses = Math.round(waterValue[0] * LITER_TO_GLASS);
      setWaterValue([glasses]);
    }
    setWaterUnit(newUnit);
  };

  const isLiters = waterUnit === 'liters';
  const displayValue = isLiters ? `${waterValue[0]} L` : `${waterValue[0]} glasses`;
  const goalText = isLiters ? "Goal: 2.0 L" : "Goal: 8 glasses";
  const sliderMax = isLiters ? 4 : 16;
  const sliderStep = isLiters ? 0.1 : 1;

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Sleep</CardTitle>
          <Bed className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{sleep[0]} hours</div>
          <p className="text-xs text-muted-foreground">Recommended: 8 hours</p>
          <Slider defaultValue={sleep} max={12} step={0.5} onValueChange={setSleep} className="mt-4" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Steps</CardTitle>
          <Footprints className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{steps[0].toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Goal: 10,000 steps</p>
          <Slider defaultValue={steps} max={20000} step={100} onValueChange={setSteps} className="mt-4" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Water Intake</CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="water-unit" className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Liters</Label>
            <Switch 
              id="water-unit" 
              checked={isLiters} 
              onCheckedChange={handleUnitToggle}
            />
            <Droplets className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{displayValue}</div>
          <p className="text-xs text-muted-foreground">{goalText}</p>
          <Slider 
            value={waterValue} 
            max={sliderMax} 
            step={sliderStep} 
            onValueChange={setWaterValue} 
            className="mt-4" 
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Health Tracking</h1>
        <p className="text-muted-foreground">Monitor your daily diet and habits.</p>
      </div>
      <Tabs defaultValue="habits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="habits">Habits</TabsTrigger>
          <TabsTrigger value="diet">Diet & Calories</TabsTrigger>
        </TabsList>
        <TabsContent value="habits" className="space-y-4">
          <HabitTracker />
        </TabsContent>
        <TabsContent value="diet" className="space-y-4">
          <DietTracker />
        </TabsContent>
      </Tabs>
    </div>
  );
}
